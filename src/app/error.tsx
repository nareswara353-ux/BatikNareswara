'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log eror ke konsol server biar lu bisa lacak bug-nya nanti
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center select-none">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛍️</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                    Waduh, Ada Kendala Teknis!
                </h2>

                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Gagal memuat halaman Batik Nareswara. Silakan periksa koneksi internet Anda atau klik tombol di bawah untuk mencoba lagi.
                </p>

                {/* Tombol sakti buat nge-trigger re-render otomatis tanpa perlu reload browser */}
                <button
                    onClick={() => reset()}
                    className="w-full bg-[#D2691E] hover:bg-[#b55a18] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-orange-100 active:scale-[0.98]"
                >
                    Coba Muat Ulang
                </button>
            </div>
        </div>
    );
}