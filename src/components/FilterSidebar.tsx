// src/components/FilterSidebar.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = [
    { id: "all", label: "Semua Koleksi" },
    { id: "tulis", label: "Batik Tulis" },
    { id: "cap", label: "Batik Cap" },
    { id: "kombinasi", label: "Batik Kombinasi" },
];

const SORT_OPTIONS = [
    { id: "newest", label: "Terbaru" },
    { id: "price_asc", label: "Harga Terendah" },
    { id: "price_desc", label: "Harga Tertinggi" },
];

export default function FilterSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get("category") || "all";
    const currentSort = searchParams.get("sort") || "newest";

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === "all" && name === "category") {
                params.delete("category");
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleCategoryChange = (categoryId: string) => {
        router.replace(`${pathname}?${createQueryString("category", categoryId)}`, { scroll: false });
    };

    const handleSortChange = (sortId: string) => {
        router.replace(`${pathname}?${createQueryString("sort", sortId)}`, { scroll: false });
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-3xl p-6 shadow-sm sticky top-24">
            <h3 className="font-serif text-xl font-bold text-slate-800 mb-6">Filter</h3>

            {/* Categories */}
            <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kategori</h4>
                <ul className="space-y-2">
                    {CATEGORIES.map((cat) => (
                        <li key={cat.id}>
                            <button
                                onClick={() => handleCategoryChange(cat.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                                    currentCategory === cat.id
                                        ? "bg-[#D2691E] text-white font-medium shadow-md"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                {cat.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Sort */}
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Urutkan</h4>
                <ul className="space-y-2">
                    {SORT_OPTIONS.map((sort) => (
                        <li key={sort.id}>
                            <button
                                onClick={() => handleSortChange(sort.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                                    currentSort === sort.id
                                        ? "bg-slate-800 text-white font-medium shadow-md"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                {sort.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
