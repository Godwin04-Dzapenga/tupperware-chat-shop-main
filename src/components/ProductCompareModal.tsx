import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, ShoppingCart, MessageCircle, Star, ArrowRight } from "lucide-react";
import { getProductMedia } from "@/data/solarProducts";

export interface CompareProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  brand?: string | null;
  model_number?: string | null;
  product_type?: string;
  stock_quantity?: number;
  avg_rating?: number;
  review_count?: number;
  variant_count?: number;
}

interface ProductCompareModalProps {
  open: boolean;
  onClose: () => void;
  products: CompareProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddToCart: (product: CompareProduct) => void;
  onOrderViaWhatsApp: (product: CompareProduct) => void;
}

export const ProductCompareModal = ({
  open,
  onClose,
  products,
  onRemove,
  onClear,
  onAddToCart,
  onOrderViaWhatsApp,
}: ProductCompareModalProps) => {
  if (products.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0046be] text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-[#ffe000]">
              Best Buy Product Comparison
            </div>
            <DialogTitle className="text-xl font-black mt-1 text-white">
              Compare Side-by-Side ({products.length} Products)
            </DialogTitle>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-xs text-white/80 hover:text-white underline font-semibold"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <div
              className="grid gap-4 min-w-[650px]"
              style={{
                gridTemplateColumns: `180px repeat(${products.length}, minmax(200px, 1fr))`,
              }}
            >
              {/* Product Info Row */}
              <div className="font-bold text-xs text-slate-400 uppercase tracking-wider self-end pb-3">
                Product Details
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div key={p.id} className="relative rounded-xl border bg-slate-50/50 p-4 flex flex-col">
                    <button
                      onClick={() => onRemove(p.id)}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50"
                      title="Remove product"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-white mb-3">
                      <img
                        src={media.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Badge className="w-fit mb-1 text-[10px] bg-[#0046be]/10 text-[#0046be] border-0 uppercase">
                      {p.brand || media.brand.split("/")[0]}
                    </Badge>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 min-h-[32px]">
                      {p.name}
                    </h4>
                    <div className="mt-2 text-lg font-black text-[#111820]">
                      ${p.price.toFixed(2)}
                    </div>
                    {media.originalPrice > p.price && (
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Save ${(media.originalPrice - p.price).toFixed(0)}
                      </div>
                    )}
                    <Button
                      onClick={() => onAddToCart(p)}
                      className="mt-3 w-full bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold text-xs h-9 shadow-sm"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Add to Cart
                    </Button>
                  </div>
                );
              })}

              {/* Row: Brand & Model */}
              <div className="font-semibold text-xs text-slate-500 py-3 border-t">
                Brand & Model
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div key={`brand-${p.id}`} className="py-3 border-t text-xs font-semibold text-slate-800">
                    {p.brand || media.brand} <br />
                    <span className="text-[10px] text-slate-400 font-normal">
                      Model: {p.model_number || media.modelNumber}
                    </span>
                  </div>
                );
              })}

              {/* Row: Rating */}
              <div className="font-semibold text-xs text-slate-500 py-3 border-t">
                Customer Rating
              </div>
              {products.map((p) => (
                <div key={`rating-${p.id}`} className="py-3 border-t text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{p.avg_rating ? p.avg_rating.toFixed(1) : "4.9"}</span>
                    <span className="text-slate-400 font-normal">({p.review_count || 18} reviews)</span>
                  </div>
                </div>
              ))}

              {/* Row: Key Specifications */}
              <div className="font-semibold text-xs text-slate-500 py-3 border-t">
                Key Specifications
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div key={`specs-${p.id}`} className="py-3 border-t text-xs space-y-1.5">
                    {media.keySpecs.map((spec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-700">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Row: Warranty */}
              <div className="font-semibold text-xs text-slate-500 py-3 border-t">
                Warranty
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div key={`warranty-${p.id}`} className="py-3 border-t text-xs font-bold text-[#0046be]">
                    {media.warranty}
                  </div>
                );
              })}

              {/* Row: Pickup & Delivery */}
              <div className="font-semibold text-xs text-slate-500 py-3 border-t">
                Availability
              </div>
              {products.map((p) => {
                const media = getProductMedia(p);
                return (
                  <div key={`avail-${p.id}`} className="py-3 border-t text-xs space-y-1">
                    <p className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {media.pickupStatus}
                    </p>
                    <p className="text-slate-500 text-[11px]">{media.deliveryStatus}</p>
                  </div>
                );
              })}

              {/* Actions row */}
              <div className="py-4 border-t font-semibold text-xs text-slate-500">
                Action
              </div>
              {products.map((p) => (
                <div key={`action-${p.id}`} className="py-4 border-t space-y-2">
                  <Button
                    onClick={() => onAddToCart(p)}
                    className="w-full bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold text-xs h-9 shadow-sm"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOrderViaWhatsApp(p)}
                    className="w-full text-xs h-8 font-bold border-slate-300 hover:bg-slate-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1 text-[#25D366]" /> WhatsApp
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Sticky Comparison Dock shown at the bottom when products are selected
interface CompareDockProps {
  products: CompareProduct[];
  onOpenModal: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const CompareDock = ({ products, onOpenModal, onRemove, onClear }: CompareDockProps) => {
  if (products.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#001e73] text-white py-3 px-4 shadow-2xl border-t-2 border-[#ffe000] animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-xs">
            <span className="font-black text-sm text-[#ffe000]">{products.length} of 4</span> products selected to compare
          </div>

          <div className="flex items-center gap-2">
            {products.map((p) => {
              const media = getProductMedia(p);
              return (
                <div
                  key={p.id}
                  className="relative group h-12 w-12 rounded-lg bg-white p-0.5 overflow-hidden border border-white/20"
                >
                  <img src={media.imageUrl} alt={p.name} className="h-full w-full object-cover rounded" />
                  <button
                    onClick={() => onRemove(p.id)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClear}
            className="text-xs text-white/70 hover:text-white underline font-semibold"
          >
            Clear
          </button>
          <Button
            onClick={onOpenModal}
            className="bg-[#ffe000] hover:bg-[#ffd200] text-black font-black text-xs h-10 px-5 shadow-lg"
          >
            Compare Now <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
