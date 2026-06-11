"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/dashboard";

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

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                if (!apiUrl) {
                    throw new Error("API URL is not configured");
                }

                let response = await fetch(`${apiUrl}/admin/products`);
                if (!response.ok) {
                    response = await fetch(`${apiUrl}/products`);
                }
                
                if (!response.ok) {
                    throw new Error(response.status === 404 ? "Produk tidak ditemukan." : "Terjadi kesalahan saat memuat data.");
                }

                const result = await response.json();
                const data = result.data || result;
                
                if (Array.isArray(data)) {
                    const rawProduct = data.find((p: any) => String(p.id || p.Id) === String(unwrappedParams.id));
                    if (rawProduct) {
                        setProduct({
                            id: rawProduct.id || rawProduct.Id,
                            title: rawProduct.title,
                            description: rawProduct.description,
                            originalPrice: Number(rawProduct.originalPrice || 0),
                            discountPrice: Number(rawProduct.discountPrice || 0),
                            primaryImage: rawProduct.imageUrl || rawProduct.image || "/placeholder.jpg"
                        } as unknown as Product);
                    } else {
                        throw new Error("Produk tidak ditemukan.");
                    }
                } else {
                    throw new Error("Data produk tidak valid.");
                }
            } catch (err: any) {
                if (process.env.NODE_ENV !== "production") {
                    console.error("[ProductFetchError]:", err);
                }
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

    const renderLoadingState = () => (
        <div className="p-6 flex-1 flex flex-col gap-6 w-full animate-pulse">
            <div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl bg-slate-200"></div>
            <div className="space-y-4 w-full">
                <div className="h-8 bg-slate-200 rounded-lg w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
            </div>
            <div className="space-y-3 mt-4">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-4/5"></div>
            </div>
        </div>
    );

    const renderErrorState = () => (
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Gagal Memuat Produk</h3>
            <p className="text-slate-500">{error}</p>
            <button 
                onClick={closeModal}
                className="mt-4 px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
                Kembali
            </button>
        </div>
    );

    const renderEmptyState = () => (
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Produk Tidak Ditemukan</h3>
            <p className="text-slate-500">Maaf, produk yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
            <button 
                onClick={closeModal}
                className="mt-4 px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
                Tutup
            </button>
        </div>
    );

    const activePrice = product ? (product.discountPrice || product.originalPrice || 0) : 0;
    const primaryImageUrl = product ? (product.primaryImage ? (Array.isArray(product.primaryImage) ? product.primaryImage[0] : product.primaryImage) : (product.images && product.images.length > 0 ? product.images[0] : "")) : "";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    />

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
                            renderLoadingState()
                        ) : error ? (
                            renderErrorState()
                        ) : !product ? (
                            renderEmptyState()
                        ) : (
                            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8 no-scrollbar">
                                <div className="w-full max-w-sm mx-auto aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                                    {primaryImageUrl ? (
                                        <Image
                                            src={primaryImageUrl}
                                            alt={product.title || "Produk Batik"}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <span>Tidak ada gambar</span>
                                        </div>
                                    )}
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
                                    onClick={() => {
                                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                        cart.push({
                                            id: product.id,
                                            title: product.title,
                                            price: product.discountPrice || product.originalPrice || 0,
                                            image: primaryImageUrl || '/placeholder.jpg',
                                            quantity: 1
                                        });
                                        localStorage.setItem('cart', JSON.stringify(cart));
                                        alert("Produk berhasil dimasukkan ke keranjang Batik Nareswara!");
                                        closeModal();
                                    }}
                                    className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-3 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 text-sm text-center"
                                >
                                    + Keranjang
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const phoneNumber = "6285600003750"; 
                                        const finalPrice = product.discountPrice || product.originalPrice || 0;
                                        const message = `Halo Batik Nareswara, saya ingin membeli produk *${product.title}* seharga *Rp ${finalPrice.toLocaleString("id-ID")}*.`;
                                        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                                        closeModal();
                                    }}
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