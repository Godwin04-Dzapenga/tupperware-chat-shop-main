/**
 * ML-style personalised recommendations engine.
 *
 * Signals used (all client-side, no server needed):
 *  1. Category affinity  — categories the user browses / adds to cart
 *  2. Price-band affinity — median price of items the user interacts with
 *  3. Collaborative filtering proxy — "customers who viewed X also viewed Y"
 *     implemented via shared-category co-occurrence scoring
 *  4. Recency decay — recent interactions weighted more heavily
 *  5. Cart exclusion — items already in cart are suppressed
 *  6. Wishlist boost — wishlisted items from same category score higher
 */

import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

export interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  avg_rating?: number;
  review_count?: number;
  stock_quantity?: number;
}

interface Interaction {
  productId: string;
  categoryId: string | null;
  price: number;
  ts: number;           // unix ms
  type: "view" | "cart" | "wishlist" | "quickview";
}

const LS_KEY = "tuppafrica_interactions";
const MAX_INTERACTIONS = 100;
const RECENCY_HALF_LIFE_MS = 1000 * 60 * 60 * 6; // 6 hours

function readInteractions(): Interaction[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function writeInteractions(interactions: Interaction[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(interactions.slice(-MAX_INTERACTIONS)));
}

function recencyWeight(ts: number): number {
  const age = Date.now() - ts;
  return Math.pow(0.5, age / RECENCY_HALF_LIFE_MS);
}

const TYPE_WEIGHT = { wishlist: 3, cart: 2.5, quickview: 1.5, view: 1 };

export function useRecommendations(allProducts: Product[], limit = 6) {
  const { items: cartItems } = useCart();
  const { items: wishlistIds } = useWishlist();
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const score = useCallback((product: Product): number => {
    const interactions = readInteractions();
    const cartIds = new Set(cartItems.map((i) => i.id));

    // Exclude items in cart
    if (cartIds.has(product.id)) return -1;
    // Exclude out-of-stock
    if ((product.stock_quantity ?? 1) === 0) return -1;

    if (interactions.length === 0) {
      // Cold start: rank by rating × log(review_count+1)
      return (product.avg_rating ?? 3) * Math.log((product.review_count ?? 0) + 2);
    }

    // Build category affinity map
    const catScores: Record<string, number> = {};
    const prices: number[] = [];

    for (const interaction of interactions) {
      const w = recencyWeight(interaction.ts) * TYPE_WEIGHT[interaction.type];
      if (interaction.categoryId) {
        catScores[interaction.categoryId] = (catScores[interaction.categoryId] ?? 0) + w;
      }
      prices.push(interaction.price);
    }

    // Price-band affinity (prefer items near user's median interaction price)
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)] ?? product.price;
    const priceDistance = Math.abs(product.price - medianPrice);
    const priceScore = 1 / (1 + priceDistance / (medianPrice || 1));

    // Category affinity
    const catScore = product.category_id ? (catScores[product.category_id] ?? 0) : 0;

    // Wishlist boost: if product shares category with a wishlisted item
    const wishlistBoost = wishlistIds.some((wId) => {
      const wp = allProducts.find((p) => p.id === wId);
      return wp?.category_id === product.category_id;
    }) ? 1.5 : 1;

    // Rating boost
    const ratingBoost = (product.avg_rating ?? 3) / 5;

    return (catScore * 2 + priceScore * 0.5 + ratingBoost) * wishlistBoost;
  }, [cartItems, wishlistIds, allProducts]);

  useEffect(() => {
    if (!allProducts.length) return;
    const scored = allProducts
      .map((p) => ({ product: p, score: score(p) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.product);
    setRecommendations(scored);
  }, [allProducts, cartItems, wishlistIds, score, limit]);

  const trackInteraction = useCallback((product: Product, type: Interaction["type"]) => {
    const interactions = readInteractions();
    interactions.push({ productId: product.id, categoryId: product.category_id, price: product.price, ts: Date.now(), type });
    writeInteractions(interactions);
  }, []);

  return { recommendations, trackInteraction };
}
