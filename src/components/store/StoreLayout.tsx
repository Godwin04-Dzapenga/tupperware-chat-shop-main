import { Outlet } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { ProductCompareModal, CompareDock } from "@/components/ProductCompareModal";
import { ProductQuickView } from "@/components/ProductQuickView";
import { StoreModal } from "@/components/StoreModal";
import { Chatbot } from "@/components/Chatbot";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions, WHATSAPP_NUMBER } from "@/hooks/useStoreActions";

export const StoreLayout = () => {
  const {
    compareProducts,
    removeCompare,
    clearCompare,
    compareModalOpen,
    setCompareModalOpen,
    quickViewProduct,
    setQuickViewProduct,
    storeModalOpen,
    setStoreModalOpen,
  } = useStoreUI();
  const { addProduct, orderViaWhatsApp } = useStoreActions();

  return (
    <div className="min-h-screen bg-bb-surface text-bb-ink flex flex-col">
      <StoreHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <StoreFooter />

      <CompareDock
        products={compareProducts}
        onOpenModal={() => setCompareModalOpen(true)}
        onRemove={removeCompare}
        onClear={clearCompare}
      />

      <StoreModal open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />

      <ProductCompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        products={compareProducts}
        onRemove={removeCompare}
        onClear={clearCompare}
        onAddToCart={addProduct}
        onOrderViaWhatsApp={orderViaWhatsApp}
      />

      <ProductQuickView
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
        onOrder={orderViaWhatsApp}
      />

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-wa shadow-2xl hover:scale-105 hover:bg-wa-dark transition-all"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>

      <Chatbot />
    </div>
  );
};
