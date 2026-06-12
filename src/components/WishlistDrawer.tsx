// src/components/WishlistDrawer.tsx
import React from "react";
// Native <img> used to bypass Next.js Image optimization 400 errors
import { Product } from "@/types/dashboard";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onToggleWishlist: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlistItems,
  onToggleWishlist,
  onProductClick,
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[50] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 p-6">
          <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Wishlist Anda ({wishlistItems.length})
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {wishlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center my-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium text-lg">Wishlist masih kosong</p>
              <p className="text-slate-400 text-sm mt-1">Simpan batik batik favorit Anda di sini.</p>
            </div>
          ) : (
            wishlistItems.map((product: Product, index: number) => {
              const activePrice = product.discountPrice || product.originalPrice || 0;
              return (
                <div
                  key={index}
                  className="flex gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => { onClose(); onProductClick(product); }}
                >
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img
                      src={product.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="}
                      alt={product.title || "Product Image"}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{product.title}</h4>
                    <p className="font-extrabold text-sm text-[#D2691E] mt-1">
                      Rp {activePrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product);
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors p-2 text-sm font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}