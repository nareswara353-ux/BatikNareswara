// src/components/SuccessPopup.tsx
import React from "react";

interface SuccessPopupProps {
    isOpen: boolean;
    title: string;
    description: string;
}

export default function SuccessPopup({ isOpen, title, description }: SuccessPopupProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-[90%] mx-auto flex flex-col items-center text-center shadow-2xl border border-slate-50 animate-scale-in">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-green-100/50">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                        <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                    {description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full">
                    <svg className="animate-spin h-3.5 w-3.5 text-orange-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Membuka WhatsApp...
                </div>
            </div>
        </div>
    );
}