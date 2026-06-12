"use client";

import { useState, useEffect } from "react";
// Native <img> used to bypass Next.js Image optimization 400 errors

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // Sesuaikan dengan tipe data product lu jika ada (misal: Product | null)
    selectedSize: string | null;
    onSelectSize: (size: string | null) => void;
    wishlistItems: any[];
    onToggleWishlist: (product: any) => void;
    quantity: number;
    setQuantity: React.Dispatch<React.SetStateAction<number>>;
    onAddToCart: () => void;
    onBuyNow: () => void;
}

export default function ProductDetailModal({
    isOpen,
    onClose,
    product,
    selectedSize,
    onSelectSize,
    wishlistItems,
    onToggleWishlist,
    quantity,
    setQuantity,
    onAddToCart,
    onBuyNow
}: ProductDetailModalProps) {

    const [activeImage, setActiveImage] = useState<string>("");

    // Reset gambar aktif dan jumlah orderan ke 1 setiap kali modal ganti produk
    useEffect(() => {
        if (product) {
            setActiveImage(product.primaryImage || "");
            setQuantity(1); // Ini sekarang mengubah state utama di page.tsx secara otomatis
        }
    }, [product, setQuantity]);

    if (!isOpen || !product) return null;

    const isInWishlist = wishlistItems.some((item) => item.id === product.id);
    const activePrice = product.discountPrice || product.originalPrice || 0;
    const gallery = [product.primaryImage, ...(product.galleryImages || [])].filter(Boolean);

    // Cari tahu stok dari ukuran yang sedang dipilih user saat ini
    const currentSizeObj = product.variants?.find((v: any) => v.size === selectedSize);
    const maxStock = currentSizeObj ? currentSizeObj.stock : 99;

    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Sheet Container */}
            <div className="relative w-full max-w-2xl bg-white rounded-t-3xl h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">

                {/* A. Header Sticky (Tetap di atas modal) */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">Detail Produk</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* B. Scrollable Body Content (Hanya area ini yang bisa di-scroll ke bawah) */}
                <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8 no-scrollbar">

                    {/* Image Gallery */}
                    <div className="flex overflow-x-auto gap-4 snap-x scrollbar-hide -mx-6 px-6 pb-2">
                        {gallery.map((img: string, idx: number) => (
                            <div
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`snap-center shrink-0 w-[85%] aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-100 border transition-all cursor-pointer ${activeImage === img ? "border-[#D2691E]" : "border-slate-100"
                                    }`}
                            >
                                <img
                                    src={img || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="}
                                    alt={`${product.title} ${idx + 1}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Title & Price & Wishlist */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-['Playfair_Display'] font-bold text-slate-900 leading-snug">
                                {product.title || "Nama Produk Tidak Tersedia"}
                            </h1>
                            <p className="text-2xl text-[#D2691E] font-bold mt-2">
                                Rp {activePrice.toLocaleString("id-ID")}
                            </p>
                        </div>

                        <button
                            onClick={() => onToggleWishlist(product)}
                            className={`p-3.5 rounded-full border shadow-sm transition-all active:scale-75 ${isInWishlist ? "bg-red-50 border-red-200 text-red-500 scale-105" : "bg-white border-slate-200 text-slate-400 hover:text-red-500"
                                }`}
                        >
                            <svg className="w-6 h-6" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Filosofi Motif Block */}
                    {product.filosofi && (
                        <div className="bg-[#FDFBF9] border border-[#f0e6de] p-5 rounded-2xl shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <h3 className="text-sm font-bold text-[#8c4613] uppercase tracking-wider">Filosofi Motif</h3>
                            </div>
                            <p className="text-[15px] text-[#5e4b3c] leading-relaxed">{product.filosofi}</p>
                        </div>
                    )}

                    {/* Size Selection */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3">Pilih Ukuran</h3>
                        <div className="flex flex-wrap gap-3">
                            {product.variants?.map((sizeObj: any) => {
                                const isOutOfStock = sizeObj.stock === 0;
                                const isLowStock = sizeObj.stock > 0 && sizeObj.stock <= 2;
                                const isSelected = selectedSize === sizeObj.size;

                                return (
                                    <button
                                        type="button"
                                        key={sizeObj.size}
                                        disabled={isOutOfStock}
                                        onClick={() => {
                                            onSelectSize(sizeObj.size);
                                            setQuantity((prev) => Math.min(prev, sizeObj.stock));
                                        }}
                                        className={`relative border-2 rounded-full px-6 py-2.5 font-bold text-sm transition-all ${isOutOfStock
                                                ? "border-slate-200 text-slate-400 bg-slate-50 line-through cursor-not-allowed opacity-70"
                                                : isSelected
                                                    ? "border-[#D2691E] text-[#D2691E] bg-orange-50 shadow-md scale-105"
                                                    : "border-slate-300 text-slate-700 bg-white hover:border-[#D2691E]"
                                            }`}
                                    >
                                        {sizeObj.size}
                                        {isLowStock && (
                                            <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse shadow-md border-2 border-white">
                                                Sisa {sizeObj.stock} potong!
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Kuantiti Counter */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-slate-800">Jumlah</h3>
                        <div className="flex items-center gap-3 bg-slate-50 w-fit p-1.5 rounded-xl border border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                            >
                                -
                            </button>
                            <span className="w-10 text-center font-bold text-slate-800 text-sm">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Deskripsi Produk */}
                    <div className="pb-4">
                        <h3 className="font-bold text-slate-800 mb-2">Deskripsi Produk</h3>
                        <div className="text-[15px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {product.description || "Belum ada deskripsi untuk produk ini."}
                        </div>
                    </div>
                </div>

                {/* C. Action Buttons Sticky (Tetap diam mengunci di bagian bawah dalam modal) */}
                <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onAddToCart}
                        className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-3 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 text-sm text-center"
                    >
                        + Keranjang
                    </button>

                    <button
                        type="button"
                        onClick={onBuyNow}
                        className="flex-1 bg-[#D2691E] text-white rounded-xl py-3 font-bold hover:bg-[#b85c1a] shadow-md hover:shadow-lg transition-all active:scale-95 text-sm text-center"
                    >
                        Beli Langsung
                    </button>
                </div>

            </div>
        </div>
    );
}