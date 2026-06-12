"use client";

import React, { useState, useEffect } from "react";
// Native <img> used to bypass Next.js Image optimization 400 errors
import { useParams } from "next/navigation";
import { Product } from "@/types/dashboard";

export default function StandaloneProductPage() {
    const params = useParams();
    const id = params?.id;
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                const response = await fetch(`${apiBase}/products`);
                if (!response.ok) throw new Error("Gagal mengambil data produk");
                const data = await response.json();
                
                // Since there is no single product endpoint in the current backend snippets, 
                // we find the product from the list.
                const rawProduct = data.find((p: any) => String(p.id || p.Id) === String(id));
                if (!rawProduct) throw new Error("Produk tidak ditemukan");
                
                const mappedProduct = {
                    ...rawProduct,
                    id: rawProduct.id || rawProduct.Id,
                    price: rawProduct.discountPrice || rawProduct.originalPrice || rawProduct.price || 0,
                    image: rawProduct.imageUrl || rawProduct.image || rawProduct.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==",
                    primaryImage: rawProduct.imageUrl || rawProduct.image || rawProduct.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="
                };
                
                setProduct(mappedProduct as any);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id]);
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
                <div className="w-12 h-12 border-4 border-[#D2691E] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9]">
                <h1 className="text-2xl font-serif text-slate-800">{error || "Produk Tidak Ditemukan"}</h1>
            </div>
        );
    }

    const activePrice = product.discountPrice || product.originalPrice || 0;

    return (
        <div className="bg-[#FDFBF9] min-h-screen text-slate-800 font-sans pb-24 pt-12">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <button
                    onClick={() => {
                        if (typeof window !== "undefined") window.history.back();
                    }}
                    className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#D2691E] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Kembali</span>
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/2 relative aspect-[3/4] bg-slate-100">
                        {product.primaryImage && (
                            <img
                                src={product.primaryImage}
                                alt={product.title || "Product Image"}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                                }}
                            />
                        )}
                    </div>
                    
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
                        <h1 className="text-3xl md:text-4xl font-['Playfair_Display'] font-bold text-slate-900 leading-snug mb-4">
                            {product.title}
                        </h1>
                        <p className="text-3xl text-[#D2691E] font-bold mb-8">
                            Rp {activePrice.toLocaleString("id-ID")}
                        </p>

                        <div className="prose prose-slate max-w-none mb-8">
                            <h3 className="font-bold text-slate-800 mb-2">Deskripsi Produk</h3>
                            <p className="text-[15px] text-slate-600 leading-relaxed">
                                {product.description || "Belum ada deskripsi untuk produk ini."}
                            </p>
                        </div>

                        <div className="mt-auto pt-8 border-t border-slate-100 flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                    cart.push({
                                        id: product.id,
                                        title: product.title,
                                        price: (product as any).price || activePrice,
                                        selectedSize: "All Size",
                                        image: (product as any).image || product.primaryImage
                                    });
                                    localStorage.setItem('cart', JSON.stringify(cart));
                                    alert("Produk berhasil dimasukkan ke keranjang Batik Nareswara!");
                                }}
                                className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-4 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 text-center"
                            >
                                + Keranjang
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const phoneNumber = "6285600003750";
                                    const price = (product as any).price || activePrice;
                                    const message = `Halo Batik Nareswara, saya ingin membeli produk *${product.title}* dengan ukuran *All Size* seharga *Rp ${price.toLocaleString("id-ID")}*.`;
                                    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="flex-1 bg-[#D2691E] text-white rounded-xl py-4 font-bold hover:bg-[#b85c1a] shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
                            >
                                Beli Langsung
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
