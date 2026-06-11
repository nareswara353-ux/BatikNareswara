"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Komponen 1: Tombol Kembali (Aman dari SSR)
export function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors gap-2 self-start mb-4"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
        </button>
    );
}

// Komponen 2: Tombol Aksi Beli (Aman dari SSR)
export default function ProductActions() {
    return (
        <div className="flex gap-4 border-t border-slate-100 pt-6 mt-8">
            <button
                type="button"
                onClick={() => alert("Ditambahkan ke keranjang via Halaman Utama!")}
                className="flex-1 border-2 border-slate-300 text-slate-700 rounded-xl py-3.5 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 text-sm text-center"
            >
                + Keranjang
            </button>
            <button
                type="button"
                onClick={() => alert("Membeli Langsung via Halaman Utama!")}
                className="flex-1 bg-[#D2691E] text-white rounded-xl py-3.5 font-bold hover:bg-[#b85c1a] shadow-md hover:shadow-lg transition-all active:scale-95 text-sm text-center"
            >
                Beli Langsung
            </button>
        </div>
    );
}