import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, ShieldCheck, Loader2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

interface Props {
  productId: string;
  avgRating?: number;
  reviewCount?: number;
}

function Stars({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              s <= (interactive ? hovered || rating : rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, avgRating = 0, reviewCount = 0 }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(full_name, email)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    setReviews((data as Review[]) || []);
    if (user && data) {
      const mine = data.find((r: any) => r.user_id === user.id);
      if (mine) {
        setUserReview(mine as Review);
        setNewRating(mine.rating);
        setNewComment(mine.comment ?? "");
      }
    }
    setLoading(false);
  };

  const submitReview = async () => {
    if (!user) { toast.error("Sign in to leave a review"); return; }
    if (newRating === 0) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);
    try {
      const payload = {
        product_id: productId,
        user_id: user.id,
        rating: newRating,
        comment: newComment.trim() || null,
      };
      const { error } = userReview
        ? await supabase.from("reviews").update({ rating: newRating, comment: newComment.trim() || null }).eq("id", userReview.id)
        : await supabase.from("reviews").insert(payload);

      if (error) throw error;
      toast.success(userReview ? "Review updated!" : "Review submitted!");
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const getName = (review: Review) => {
    const name = review.profiles?.full_name || review.profiles?.email?.split("@")[0];
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Customer";
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-primary">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
          <Stars rating={Math.round(avgRating)} />
          <p className="text-xs text-muted-foreground mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-muted-foreground">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-4 text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a review */}
      {user && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h4 className="font-semibold text-sm">{userReview ? "Update Your Review" : "Write a Review"}</h4>
          <div className="flex items-center gap-2">
            <Stars rating={newRating} interactive onRate={setNewRating} />
            {newRating > 0 && (
              <span className="text-xs text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][newRating]}
              </span>
            )}
          </div>
          <Textarea
            placeholder="Share your experience (optional)..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{newComment.length}/1000</span>
            <Button size="sm" className="rounded-full" onClick={submitReview} disabled={submitting || newRating === 0}>
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</> : userReview ? "Update" : "Submit Review"}
            </Button>
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">
                    {getName(review)[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{getName(review)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {review.verified && (
                    <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-0 gap-0.5">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
              <Stars rating={review.rating} />
              {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
