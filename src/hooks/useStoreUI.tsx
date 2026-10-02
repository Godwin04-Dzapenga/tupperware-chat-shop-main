import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import type { StoreProduct } from "@/hooks/useCatalog";

interface StoreUIContextValue {
  compareProducts: StoreProduct[];
  toggleCompare: (product: StoreProduct) => void;
  removeCompare: (id: string) => void;
  clearCompare: () => void;
  compareModalOpen: boolean;
  setCompareModalOpen: (open: boolean) => void;
  quickViewProduct: StoreProduct | null;
  setQuickViewProduct: (product: StoreProduct | null) => void;
  storeModalOpen: boolean;
  setStoreModalOpen: (open: boolean) => void;
}

const StoreUIContext = createContext<StoreUIContextValue | undefined>(undefined);

export const StoreUIProvider = ({ children }: { children: React.ReactNode }) => {
  const [compareProducts, setCompareProducts] = useState<StoreProduct[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const toggleCompare = useCallback((product: StoreProduct) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        toast.info(`Removed ${product.name} from comparison`);
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        toast.error("You can compare up to 4 products at once.");
        return prev;
      }
      toast.success(`Added ${product.name} to comparison list`);
      return [...prev, product];
    });
  }, []);

  const removeCompare = useCallback((id: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareProducts([]);
  }, []);

  const value = useMemo(
    () => ({
      compareProducts,
      toggleCompare,
      removeCompare,
      clearCompare,
      compareModalOpen,
      setCompareModalOpen,
      quickViewProduct,
      setQuickViewProduct,
      storeModalOpen,
      setStoreModalOpen,
    }),
    [compareProducts, toggleCompare, removeCompare, clearCompare, compareModalOpen, quickViewProduct, storeModalOpen]
  );

  return <StoreUIContext.Provider value={value}>{children}</StoreUIContext.Provider>;
};

export const useStoreUI = () => {
  const context = useContext(StoreUIContext);
  if (!context) throw new Error("useStoreUI must be used within StoreUIProvider");
  return context;
};
