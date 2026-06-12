"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const FALLBACK_SVG_BASE64 =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";

interface ProductVariant {
    id?: string | number;
    size: string;
    stock: number;
}

interface LocalProduct {
    id: string;
    title: string;
    description: string;
    originalPrice: number;
    discountPrice: number;
    imageUrl: string;
    variants: ProductVariant[];
}

interface ContentProps {
    params: Promise<{ id: string }>;
}

export default function ProductModalContent({ params }: ContentProps) {
    return (
        <Suspense fallback={null}>
            <ModalContent params={params} />
        </Suspense>
    );
}

function ModalContent({ params }: ContentProps) {
    const router = useRouter();
    const unwrappedParams = React.use(params);

    const [product, setProduct] = useState<LocalProduct | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

    // State untuk menyimpan ukuran yang dipilih pembeli
    const [selectedSize, setSelectedSize] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                
                // Gunakan endpoint admin agar varian yang di-include .NET terbaca sempurna, fallback ke /products
                let response = await fetch(`${apiUrl}/admin/products`).catch(() => null);
                if (!response || !response.ok) {
                    response = await fetch(`${apiUrl}/products`);
                }

                if (!response.ok) {
                    throw new Error("Gagal memuat katalog batik.");
                }

                const data = await response.json();
                const productList: unknown[] = Array.isArray(data) ? data : ((data as Record<string, unknown>).data as unknown[] || []);

                const foundProduct = productList.find((raw: unknown) => {
                    const p = raw as Record<string, unknown>;
                    return String(p.id || p.Id) === String(unwrappedParams.id);
                }) as Record<string, unknown> | undefined;

                if (foundProduct) {
                    // Ambil array varian seaman mungkin dari segala macam ejaan .NET
                    const rawVariants = (foundProduct.variants || foundProduct.Variants || foundProduct.productVariants || foundProduct.ProductVariants || []) as Record<string, unknown>[];
                    const mappedVariants: ProductVariant[] = rawVariants.map((v: Record<string, unknown>) => ({
                        id: (v.id as string | number | undefined) ?? (v.Id as string | number | undefined),
                        size: String(v.size || v.Size || "All Size"),
                        stock: v.stock !== undefined ? Number(v.stock) : Number(v.Stock || 0)
                    }));

                    setProduct({
                        id: String(foundProduct.id || foundProduct.Id || ""),
                        title: String(foundProduct.title || foundProduct.Title || "Produk Batik"),
                        description: String(foundProduct.description || foundProduct.Description || ""),
                        originalPrice: Number(foundProduct.originalPrice || foundProduct.OriginalPrice || 0),
                        discountPrice: Number(foundProduct.discountPrice || foundProduct.DiscountPrice || 0),
                        imageUrl: String(foundProduct.imageUrl || foundProduct.image || foundProduct.primaryImage || foundProduct.PrimaryImage || ""),
                        variants: mappedVariants
                    });

                    // Set default ukuran pertama yang stoknya masih tersedia
                    const availableSize = mappedVariants.find((v: ProductVariant) => v.stock > 0);
                    if (availableSize) {
                        setSelectedSize(availableSize.size);
                    }
                } else {
                    throw new Error("Produk tidak ditemukan.");
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        if (unwrappedParams.id) {
            fetchProduct();
        }
    }, [unwrappedParams.id]);

    const closeModal = () => {
        setIsOpen(false);
        setTimeout(() => {
            router.back();
        }, 300);
    };

    const activePrice = product ? (product.discountPrice > 0 ? product.discountPrice : product.originalPrice) : 0;

    const handleAddToCart = () => {
        if (!product) return;
        if (!selectedSize) {
            alert("Silakan pilih ukuran terlebih dahulu!");
            return;
        }

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cart.push({
            id: product.id,
            title: product.title,
            price: activePrice,
            image: product.imageUrl,
            selectedSize: selectedSize,
            quantity: 1
        });

        localStorage.setItem("cart", JSON.stringify(cart));
        setShowSuccessToast(true);

        setTimeout(() => {
            setShowSuccessToast(false);
            closeModal();
        }, 1800);
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (!selectedSize) {
            alert("Silakan pilih ukuran terlebih dahulu!");
            return;
        }

        const phoneNumber = "6285600003750";
        const message = `Halo *Batik Nareswara*, saya ingin membeli produk *${product.title}* dengan Ukuran: *${selectedSize}* seharga *Rp ${activePrice.toLocaleString("id-ID")}*. Apakah produk ready?`;

        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
        closeModal();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

                    {/* Toast Centang Hijau */}
                    <AnimatePresence>
                        {showSuccessToast && (
                            <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -20 }} className="absolute top-10 z-[300] bg-emerald-500 text-white font-semibold px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400">
                                <div className="bg-white text-emerald-500 rounded-full p-1 flex items-center justify-center shadow-inner">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span>Berhasil dimasukkan ke keranjang Batik Nareswara!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modal Content */}
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-2xl bg-white rounded-t-3xl h-[85vh] flex flex-col shadow-2xl">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl shrink-0">
                            <h2 className="font-bold text-lg text-slate-800">Detail Produk</h2>
                            <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="p-6 flex-1 flex flex-col gap-6 w-full animate-pulse"><div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl bg-slate-200"></div></div>
                        ) : error ? (
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4"><h3 className="text-xl font-bold text-slate-800">Gagal Memuat Produk</h3><p className="text-slate-500">{error}</p></div>
                        ) : !product ? (
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4"><h3 className="text-xl font-bold text-slate-800">Produk Tidak Ditemukan</h3></div>
                        ) : (
                            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 no-scrollbar">
                                <div className="w-full max-w-sm mx-auto aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                                    <img 
                                        src={product.imageUrl || FALLBACK_SVG_BASE64} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = FALLBACK_SVG_BASE64; }}
                                    />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 leading-snug">{product.title}</h1>
                                    <p className="text-2xl text-[#D2691E] font-bold mt-1">Rp {activePrice.toLocaleString("id-ID")}</p>
                                </div>

                                {/* ✨ SEKTOR BARU: UI PILIH UKURAN REAL-TIME */}
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800 mb-2">Pilih Ukuran Tersedia:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.length > 0 ? (
                                            product.variants.map((v, i) => {
                                                const hasStock = v.stock > 0;
                                                const isSelected = selectedSize === v.size;
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        disabled={!hasStock}
                                                        onClick={() => setSelectedSize(v.size)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${!hasStock
                                                                ? "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed"
                                                                : isSelected
                                                                    ? "bg-[#D2691E] text-white border-[#D2691E] shadow-sm"
                                                                    : "bg-white text-slate-700 border-slate-300 hover:border-[#D2691E]"
                                                            }`}
                                                    >
                                                        Size {v.size} ({v.stock} pcs)
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">All Size / Hubungi Admin</span>
                                        )}
                                    </div>
                                </div>

                                <div className="pb-4">
                                    <h3 className="font-bold text-slate-800 mb-1">Filosofi & Deskripsi</h3>
                                    <div className="text-[14px] text-slate-600 whitespace-pre-wrap leading-relaxed">{product.description}</div>
                                </div>
                            </div>
                        )}

                        {!isLoading && !error && product && (
                            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0 rounded-b-3xl">
                                <button type="button" onClick={handleAddToCart} className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-3 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all text-xs">
                                    + Keranjang
                                </button>
                                <button type="button" onClick={handleBuyNow} className="flex-1 bg-[#D2691E] text-white rounded-xl py-3 font-bold hover:bg-[#b85c1a] shadow-md transition-all text-xs">
                                    Beli Langsung
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}