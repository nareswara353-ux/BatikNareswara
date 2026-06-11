// src/components/HeroSection.tsx
import React from "react";
import Image from "next/image";

interface HeroSectionProps {
    // Cukup tulis HTMLDivElement saja, tidak perlu pakai "| null" di dalam kurung siku
    elementRef: React.RefObject<HTMLDivElement>;
}

export default function HeroSection({ elementRef }: HeroSectionProps) {
    return (
        <div className="fixed top-0 left-0 w-full h-screen z-10 pointer-events-none">
            {/* Diubah dari <section> menjadi <div> agar tipenya COCOK dengan HTMLDivElement */}
            <div
                ref={elementRef}
                className="relative h-screen w-full z-10 overflow-hidden pointer-events-auto"
            >
                <Image
                    src="/1.png"
                    alt="Batik Nareswara Hero Image"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-[#FDFBF9]/90 flex flex-col items-center justify-center">
                    <h1 className="font-serif text-5xl md:text-7xl text-[#D4AF37] font-bold tracking-wide text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">
                        Batik Nareswara
                        <span className="block text-xl md:text-3xl font-light tracking-[0.2em] mt-4 font-sans text-[#FDFBF9] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                            HERITAGE BATIK
                        </span>
                    </h1>
                </div>
            </div>
        </div>
    );
}