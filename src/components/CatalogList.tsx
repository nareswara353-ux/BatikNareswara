// src/components/CatalogList.tsx
"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types/dashboard";
import { motion } from "framer-motion";

interface CatalogListProps {
    products: Product[];
    debouncedSearchQuery: string;
    onProductClick: (product: Product) => void;
    onClearSearch: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function CatalogList({
    products,
    debouncedSearchQuery,
    onProductClick,
    onClearSearch,
}: CatalogListProps) {
    // Logic filter pencarian (Sebagian besar nanti dihandle Orama & URL, 
    // tapi ini sebagai fallback lokal kalau dibutuhkan)
    const filteredProducts = products?.filter((product: Product) =>
        product.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ) || [];

    // Kondisi 1: Kalau produk dari API emang beneran kosong
    if (!products || products.length === 0) {
        return (
            <div className="flex items-center justify-center py-32 bg-white/60 rounded-3xl border border-slate-100 shadow-sm backdrop-blur-md">
                <p className="text-lg md:text-xl text-slate-500 italic font-light font-serif">
                    Belum ada koleksi batik tersedia.
                </p>
            </div>
        );
    }

    // Kondisi 2: Kalau hasil pencarian keyword lu gak ketemu
    if (filteredProducts.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-24 px-4 bg-white/60 rounded-3xl border border-slate-100 shadow-sm backdrop-blur-md"
            >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-100/50">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 11h.01M12 14h.01" />
                    </svg>
                </div>
                <h3 className="text-slate-700 font-bold text-lg font-serif">Batik Tidak Ditemukan</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-[280px] leading-relaxed">
                    Waduh, keyword-nya kurang pas, Res. Coba cari dengan nama batik lain.
                </p>
                <button
                    onClick={onClearSearch}
                    className="mt-5 bg-[#D2691E] text-white px-5 py-2 rounded-full text-xs font-bold transition-all hover:bg-[#b85c1a] active:scale-95 shadow-sm"
                >
                    Hapus Pencarian
                </button>
            </motion.div>
        );
    }

    // Kondisi 3: Tampilkan grid produk dengan Staggered Animation
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
            {filteredProducts.map((product: Product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onProductClick}
                />
            ))}
        </motion.div>
    );
}