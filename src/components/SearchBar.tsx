// src/components/SearchBar.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Mic, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { create, insertMultiple, search as oramaSearch, AnyOrama } from "@orama/orama";
import { Product } from "@/types/dashboard";

interface SearchBarProps {
    products: Product[];
}

// Typing web speech api
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function SearchBar({ products }: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const urlSearchQuery = searchParams.get("search") || "";
    
    // Local display state to make typing feel instant
    const [inputValue, setInputValue] = useState(urlSearchQuery);
    const [isListening, setIsListening] = useState(false);
    const [oramaIndex, setOramaIndex] = useState<AnyOrama | null>(null);
    const [isIndexing, setIsIndexing] = useState(false);
    
    const dbRef = useRef<AnyOrama | null>(null);

    // Initialize Orama DB
    useEffect(() => {
        const initOrama = async () => {
            if (!products || products.length === 0) return;
            setIsIndexing(true);
            try {
                const db = await create({
                    schema: {
                        id: "string",
                        title: "string",
                        category: "string",
                        description: "string",
                    },
                });

                const documents = products.map((p) => ({
                    id: String(p.id),
                    title: p.title || "",
                    category: p.category || "",
                    description: p.description || "",
                }));

                await insertMultiple(db, documents);
                dbRef.current = db;
                setOramaIndex(db);
            } catch (err) {
                console.error("Failed to initialize Orama:", err);
            } finally {
                setIsIndexing(false);
            }
        };

        initOrama();
    }, [products]);

    // Update URL when input changes (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (inputValue.trim()) {
                params.set("search", inputValue.trim());
            } else {
                params.delete("search");
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }, 400);

        return () => clearTimeout(timer);
    }, [inputValue, pathname, router, searchParams]);

    // Sync input with URL if it changes externally
    useEffect(() => {
        if (urlSearchQuery !== inputValue) {
            setInputValue(urlSearchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlSearchQuery]);

    // Voice Search Feature
    const handleVoiceSearch = () => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            alert("Maaf, browser Anda tidak mendukung fitur pencarian suara.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = "id-ID";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    return (
        <div className="relative max-w-2xl mx-auto w-full group mb-12">
            <div className={`absolute inset-0 bg-gradient-to-r from-[#D2691E]/20 to-[#8B4513]/20 rounded-full blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100 ${isListening ? 'opacity-100 animate-pulse' : ''}`} />
            
            <div className="relative flex items-center bg-white border border-slate-200/80 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300 p-2 pl-6 overflow-hidden">
                <Search className={`w-5 h-5 ${isListening ? 'text-[#D2691E]' : 'text-slate-400'} transition-colors`} />
                
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? "Mendengarkan..." : "Cari koleksi batik impianmu..."}
                    className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 placeholder:text-slate-400 font-medium text-[15px]"
                />
                
                <div className="flex items-center gap-2">
                    {isIndexing && (
                        <div className="px-3">
                            <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                        </div>
                    )}
                    
                    <button
                        onClick={handleVoiceSearch}
                        className={`p-3 rounded-full transition-all duration-300 ${
                            isListening 
                                ? "bg-red-50 text-red-500 shadow-inner animate-pulse" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                        }`}
                        title="Pencarian Suara"
                    >
                        <Mic className={`w-5 h-5 ${isListening ? 'scale-110' : ''} transition-transform`} />
                    </button>
                </div>
            </div>
        </div>
    );
}