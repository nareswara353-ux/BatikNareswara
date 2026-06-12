"use client";

// Native <img> used to bypass Next.js Image optimization 400 errors
import { motion } from "framer-motion";
import { Product } from "@/types/dashboard";

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as any,
            stiffness: 260,
            damping: 20
        }
    }
};

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const activePrice = product.discountPrice || product.originalPrice || 0;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.96 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col group border border-slate-50 select-none"
            onClick={() => onClick(product)}
        >
            {/* Area Foto Produk */}
            <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden">
                <img
                    src={product.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="}
                    alt={product.title || "Product Image"}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                    }}
                />

                {/* Badge diskon dengan Framer Motion */}
                {product.discountPrice && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: "spring" as any, stiffness: 300, damping: 15, delay: 0.2 }}
                        className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm z-10"
                    >
                        SALE
                    </motion.span>
                )}
            </div>

            {/* Area Detail Info Produk */}
            <div className="p-4 flex flex-col flex-grow justify-between bg-white z-10">
                <h3 className="font-semibold text-[15px] leading-tight text-slate-800 line-clamp-2 mb-2 group-hover:text-[#D2691E] transition-colors">
                    {product.title}
                </h3>

                <div className="flex flex-col gap-0.5">
                    <p className="text-[15px] font-bold text-[#D2691E]">
                        Rp {activePrice.toLocaleString("id-ID")}
                    </p>

                    {/* Cek Harga Coret */}
                    {product.discountPrice && (
                        <p className="text-[11px] text-slate-400 line-through">
                            Rp {(product.originalPrice || 0).toLocaleString("id-ID")}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}