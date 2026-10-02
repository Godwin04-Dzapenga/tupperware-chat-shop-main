import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { StoreUIProvider } from "@/hooks/useStoreUI";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StoreLayout } from "@/components/store/StoreLayout";
import SolarHome from "./pages/SolarHome";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import About from "./pages/About";
import Account from "./pages/Account";
import ProductDetail from "./pages/ProductDetail";
import ProductVariantsAdmin from "./pages/ProductVariantsAdmin";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right" />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <StoreUIProvider>
                <Routes>
                  <Route element={<StoreLayout />}>
                    <Route path="/" element={<SolarHome />} />
                    <Route path="/c/:slug" element={<CategoryPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/c/:slug" element={<CategoryPage />} />                  <Route path="/search" element={<SearchPage />} />                  <Route path="/deals" element={<DealsPage />} />                  <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Checkout renders its own minimal secure-checkout header */}
                  <Route path="/checkout" element={<Checkout />} />

                  <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                  <Route path="/admin/products/:id/variants" element={<ProtectedRoute requireAdmin><ProductVariantsAdmin /></ProtectedRoute>} />
                </Routes>
              </StoreUIProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
