"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductDetailModal from "@/components/ProductDetailModal";
import WishlistDrawer from "@/components/WishlistDrawer";
import CartDrawer from "@/components/CartDrawer";
import BottomNav from "@/components/BottomNav";
import SuccessPopup from "@/components/SuccessPopup";
import ProductSkeleton from "@/components/ProductSkeleton";
import FilterSidebar from "@/components/FilterSidebar";
import { NOMOR_WA, Product, CartItem } from "@/types/dashboard";
import HeroSection from "@/components/HeroSection";
import CatalogList from "@/components/CatalogList";
import { Search } from "lucide-react";

interface APIProduct {
  id?: string;
  title?: string;
  primaryImage?: string;
  originalPrice?: number | string;
  discountPrice?: number | string;
  category?: string;
  [key: string]: any;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || "all";
  const sortParam = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchDebounceRef = useRef<number | null>(null);

  // Sync searchInput with URL params
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Filter & Search URL Driven
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (categoryParam !== "all") params.set("category", categoryParam);
    if (sortParam !== "newest") params.set("sort", sortParam);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    // Use NEXT_PUBLIC_API_BASE_URL from env (client-side). Fallback to localhost:5000/api.
    const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
    // Remove any trailing slashes to avoid // in requests and ensure port matches
    const apiBase = rawApiBase.replace(/\/+$/, "");

    fetch(`${apiBase}/products${queryString}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data produk");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Format data tidak valid dari server");
        }
        const safeProducts = data.map((product: APIProduct) => ({
          ...product,
          id: product.id || Math.random().toString(),
          title: product.title || "Produk Tanpa Nama",
          primaryImage: product.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==",
          originalPrice: Number(product.originalPrice) || 0,
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        })) as Product[];
        setProducts(safeProducts);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setError(error.message || "Terjadi kesalahan saat menghubungi server.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, categoryParam, sortParam]); // Dependency URL Params

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDescription, setPopupDescription] = useState("");

  const heroRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      router.push(`/?${params.toString()}`, { scroll: false });
    }, 450);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("search", searchInput.trim());
      router.push(`/?${params.toString()}`, { scroll: false });
    }
  };

  const handleNavHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavExplore = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProductClick = (product: Product) => {
    // Navigasi URL memicu route interception '@modal/(.)product/[id]' di Next.js App Router
    router.push(`/product/${product.id}`, { scroll: false });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedSize(null);
  };

  const addToCartLogic = (product: Product, size: string, quantity: number) => {
    setCartItems((prevItems: any[]) => {
      const existingItemIndex = prevItems.findIndex(
        (item: any) => item.product.id === product.id && item.selectedSize === size
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, { product, selectedSize: size, quantity }];
      }
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (!selectedSize) {
      alert("Waduh Res, pilih ukuran (Size) batiknya dulu yaa!");
      return;
    }

    addToCartLogic(selectedProduct as Product, selectedSize as string, detailQuantity);
    setIsDetailOpen(false);
    setIsCartOpen(true);
    setDetailQuantity(1);
  };

  const sendToWhatsApp = (itemsToOrder: CartItem[], grandTotal: number) => {
    let message = `*HALO BATIK NARESWARA, SAYA MAU ORDER*\n\n`;
    message += `Berikut adalah detail pesanan saya:\n`;
    message += `===============================\n\n`;
    itemsToOrder.forEach((item, index) => {
      const productName = (item.product as any).title ?? item.product.title;
      const price = (item.product as any).discountPrice || (item.product as any).originalPrice || 0;
      const subtotal = price * item.quantity;

      message += `*${index + 1}. ${productName}*\n`;
      message += `   - Ukuran: ${item.selectedSize}\n`;
      message += `   - Jumlah: ${item.quantity}x\n`;
      message += `   - Subtotal: Rp ${subtotal.toLocaleString("id-ID")}\n\n`;
    });
    message += `===============================\n`;
    message += `*TOTAL PEMBAYARAN:* Rp ${grandTotal.toLocaleString("id-ID")}\n\n`;
    message += `Mohon info untuk instruksi pembayaran dan pengirimannya ya kak.\nTerima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    if (!NOMOR_WA) {
      alert("Nomor WhatsApp belum dikonfigurasi. Silakan isi NEXT_PUBLIC_WHATSAPP_NUMBER di .env.local");
      console.warn("NEXT_PUBLIC_WHATSAPP_NUMBER is missing. Message:", message);
      return;
    }
    window.open(`https://wa.me/${NOMOR_WA}?text=${encodedMessage}`, "_blank");
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    if (!selectedSize) {
      alert("Eits, pilih ukurannya dulu bos biar pas di badan!");
      return;
    }

    addToCartLogic(selectedProduct as Product, selectedSize as string, detailQuantity);
    const activePrice = (selectedProduct as any).discountPrice || (selectedProduct as any).originalPrice || 0;
    const instantItem: CartItem = {
      product: selectedProduct as Product,
      selectedSize: selectedSize as string,
      quantity: detailQuantity,
    };
    const productName = (selectedProduct as any).title ?? selectedProduct.title;

    setPopupTitle("Pembelian Langsung Diproses!");
    setPopupDescription(`Menghubungkan ke WhatsApp untuk memesan ${detailQuantity}x ${productName} (Size ${selectedSize}).`);
    setShowSuccessPopup(true);
    setIsDetailOpen(false);

    setTimeout(() => {
      sendToWhatsApp([instantItem], activePrice * detailQuantity);
      setShowSuccessPopup(false);
    }, 2000);
  };

  const handleCheckoutCart = () => {
    if (cartItems.length === 0) return;
    setPopupTitle("Pesanan Keranjang Diproses!");
    setPopupDescription(`Mempersiapkan data dari ${cartItems.length} model batik di keranjang Anda menuju WhatsApp.`);
    setShowSuccessPopup(true);
    setIsCartOpen(false);
    setTimeout(() => {
      sendToWhatsApp(cartItems, calculateTotal());
      setShowSuccessPopup(false);
    }, 2000);
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlistItems((prev) => {
      const isExist = prev.some((item) => item.id === product.id);
      if (isExist) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total: number, item: any) => {
      const activePrice = item.product.discountPrice || item.product.originalPrice || 0;
      return total + activePrice * item.quantity;
    }, 0);
  };

  return (
    <div className="bg-[#FDFBF9] min-h-screen text-slate-800 font-sans relative pb-24">
      <HeroSection elementRef={heroRef as any} />
      <div className="h-screen w-full relative z-0"></div>

      <section
        ref={catalogRef}
        className="relative z-20 bg-[#FDFBF9] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] min-h-screen rounded-t-[2rem] md:rounded-t-[3rem] pt-8 px-4 md:px-8 pb-10"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

          {/* Sidebar Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          <div className="flex-1">
            <div className="mb-8">
              <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto w-full group">
                <div className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 p-2 pl-6 overflow-hidden focus-within:border-[#D2691E]">
                  <Search className="w-5 h-5 text-slate-400 transition-colors group-focus-within:text-[#D2691E]" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    placeholder="Cari koleksi batik impianmu..."
                    className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 placeholder:text-slate-400 font-medium text-[15px]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-[#D2691E] rounded-full text-sm font-medium hover:bg-[#b05515] transition-colors"
                  >
                    Cari
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-4">
              <h2 className="font-serif text-3xl font-bold mb-8 text-center md:text-left text-[#2c231f]">
                Koleksi Terbaru
              </h2>

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl shadow-sm border border-red-50">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2c231f] mb-2">Gagal Memuat Produk</h3>
                  <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-[#D2691E] text-white rounded-full font-medium hover:bg-[#b05515] transition-colors shadow-md"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-5">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2c231f] mb-2">Produk Tidak Ditemukan</h3>
                  <p className="text-gray-500 max-w-md mb-6">Maaf, kami tidak dapat menemukan produk yang sesuai dengan pencarian Anda. Silakan coba kata kunci lain atau hapus filter.</p>
                  <button
                    onClick={() => {
                      window.history.replaceState(null, '', window.location.pathname);
                      window.location.reload();
                    }}
                    className="px-6 py-2.5 bg-[#D2691E] text-white rounded-full font-medium hover:bg-[#b05515] transition-colors shadow-md"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <CatalogList
                  products={products}
                  debouncedSearchQuery={searchQuery}
                  onProductClick={handleProductClick}
                  onClearSearch={() => {
                    window.history.replaceState(null, '', window.location.pathname);
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Backward compatible Modal. The Next.js intercepting route will override this eventually. */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        product={selectedProduct}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        wishlistItems={wishlistItems}
        onToggleWishlist={handleToggleWishlist}
        quantity={detailQuantity}
        setQuantity={setDetailQuantity}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onToggleWishlist={handleToggleWishlist}
        onProductClick={handleProductClick}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
        totalPrice={calculateTotal()}
        onCheckout={handleCheckoutCart}
        onNavExplore={handleNavExplore}
      />

      <BottomNav
        onNavHome={handleNavHome}
        onNavExplore={handleNavExplore}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistItems.length}
        cartCount={cartItems.length}
      />

      <SuccessPopup
        isOpen={showSuccessPopup}
        title={popupTitle}
        description={popupDescription}
      />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-[#D2691E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}