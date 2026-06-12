"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ✅ 1. BIKIN TIPE DATA LOKAL BIAR TYPESCRIPT GAK PROTES LAGI
interface LocalProduct {
    id: string;
    title: string;
    description: string;
    originalPrice: number;
    discountPrice: number;
    imageUrl: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    message?: string;
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

    // Gunakan Tipe Data Lokal yang baru kita buat
    const [product, setProduct] = useState<LocalProduct | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                const response = await fetch(`${apiUrl}/products`);

                if (!response.ok) {
                    throw new Error("Terjadi kesalahan saat memuat data katalog.");
                }

                const data = await response.json();
                const productList = Array.isArray(data) ? data : (data.data || []);

                const foundProduct = productList.find((p: any) =>
                    String(p.id || p.Id) === String(unwrappedParams.id)
                );

                if (foundProduct) {
                    // ✅ FORCE MAPPING: Paksa konversi tipe data biar ga ada nilai 'null' atau properti hilang
                    setProduct({
                        id: String(foundProduct.id || foundProduct.Id || ""),
                        title: String(foundProduct.title || foundProduct.Title || "Produk Batik"),
                        description: String(foundProduct.description || foundProduct.Description || ""),
                        originalPrice: Number(foundProduct.originalPrice || foundProduct.OriginalPrice || 0),
                        discountPrice: Number(foundProduct.discountPrice || foundProduct.DiscountPrice || 0),
                        imageUrl: String(foundProduct.imageUrl || foundProduct.image || "/placeholder.jpg")
                    });
                } else {
                    throw new Error("Produk tidak ditemukan di dalam sistem katalog.");
                }
            } catch (err: any) {
                setError(err.message || "Terjadi kesalahan yang tidak terduga.");
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

    // ✅ ANTISIPASI NULL: Ambil harga diskon atau original dengan fallback angka 0 murni
    const getFinalPrice = () => {
        if (!product) return 0;
        return product.discountPrice > 0 ? product.discountPrice : product.originalPrice;
    };

    const handleAddToCart = () => {
        if (!product) return;

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const finalPrice = getFinalPrice();

        cart.push({
            id: product.id,
            title: product.title,
            price: finalPrice,
            image: product.imageUrl,
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

        const phoneNumber = "6285600003750";
        const finalPrice = getFinalPrice();

        const message = `Halo *Batik Nareswara*, saya ingin membeli produk premium *${product.title}* seharga *Rp ${finalPrice.toLocaleString("id-ID")}*. Apakah produk ini ready?`;

        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
        closeModal();
    };

    const activePrice = getFinalPrice();
    const primaryImageUrl = product ? product.imageUrl : "/placeholder.jpg";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Pop-up Centang Hijau */}
                    <AnimatePresence>
                        {showSuccessToast && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                className="absolute top-10 z-[300] bg-emerald-500 text-white font-semibold px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400"
                            >
                                <div className="bg-white text-emerald-500 rounded-full p-1 flex items-center justify-center shadow-inner">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span>Berhasil dimasukkan ke keranjang Batik Nareswara!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modal Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-2xl bg-white rounded-t-3xl h-[85vh] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl shrink-0">
                            <h2 className="font-bold text-lg text-slate-800">Detail Produk</h2>
                            <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body Content */}
                        {isLoading ? (
                            <div className="p-6 flex-1 flex flex-col gap-6 w-full animate-pulse">
                                <div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl bg-slate-200"></div>
                            </div>
                        ) : error ? (
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
                                <h3 className="text-xl font-bold text-slate-800">Gagal Memuat Produk</h3>
                                <p className="text-slate-500">{error}</p>
                            </div>
                        ) : !product ? (
                            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
                                <h3 className="text-xl font-bold text-slate-800">Produk Tidak Ditemukan</h3>
                            </div>
                        ) : (
                            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8 no-scrollbar">
                                <div className="w-full max-w-sm mx-auto aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                                    <Image
                                        src={primaryImageUrl}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        unoptimized={true}
                                    />
                                </div>

                                <div>
                                    <h1 className="text-2xl md:text-3xl font-['Playfair_Display'] font-bold text-slate-900 leading-snug">
                                        {product.title}
                                    </h1>
                                    <p className="text-2xl text-[#D2691E] font-bold mt-2">
                                        Rp {activePrice.toLocaleString("id-ID")}
                                    </p>
                                </div>

                                <div className="pb-4">
                                    <h3 className="font-bold text-slate-800 mb-2">Deskripsi Produk</h3>
                                    <div className="text-[15px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {product.description || "Belum ada deskripsi untuk produk ini."}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!isLoading && !error && product && (
                            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0 rounded-b-3xl">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-3 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 text-sm text-center"
                                >
                                    + Keranjang
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBuyNow}
                                    className="flex-1 bg-[#D2691E] text-white rounded-xl py-3 font-bold hover:bg-[#b85c1a] shadow-md hover:shadow-lg transition-all active:scale-95 text-sm text-center"
                                >
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