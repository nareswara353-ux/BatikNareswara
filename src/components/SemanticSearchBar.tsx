"use client";

import React, { useState, useEffect } from "react";
import { Search, Mic, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SemanticProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export default function SemanticSearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SemanticProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce input to prevent hitting API too often
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch from Semantic Search API
  useEffect(() => {
    const searchSemantic = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiUrl}/products/search-semantic?q=${encodeURIComponent(debouncedQuery)}`);
        
        if (!response.ok) {
          throw new Error("Failed to search products");
        }
        
        const data: SemanticProductDto[] = await response.json();
        setResults(data);
      } catch (err) {
        console.error(err);
        setError("Gagal melakukan pencarian AI.");
      } finally {
        setIsLoading(false);
      }
    };

    searchSemantic();
  }, [debouncedQuery]);

  return (
    <div className="relative max-w-3xl mx-auto w-full group mb-12">
      {/* Search Input Container */}
      <div className="relative z-10 flex items-center bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 p-2 pl-6 overflow-hidden">
        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tanya AI: 'Batik warna merah untuk kondangan...'"
          className="flex-1 bg-transparent border-none outline-none px-4 text-slate-700 placeholder:text-slate-400 font-medium text-[15px]"
        />
        
        <div className="flex items-center gap-2 pr-2">
          <button
            className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors duration-300"
            title="Pencarian Suara AI"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dropdown Results (Absolute Positioning) */}
      <AnimatePresence>
        {(query.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl p-4 z-50 max-h-[70vh] overflow-y-auto custom-scrollbar"
          >
            {isLoading ? (
              // Gorgeous Skeleton Shimmer Loader
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-400 mb-4 px-2">AI sedang menganalisa...</div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-2xl bg-slate-50 animate-pulse">
                    <div className="w-20 h-20 bg-slate-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 py-2">
                      <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-3" />
                      <div className="h-3 bg-slate-200 rounded-full w-full mb-2" />
                      <div className="h-3 bg-slate-200 rounded-full w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                <p>{error}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-indigo-500 mb-3 px-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Hasil Rekomendasi AI
                </div>
                {results.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group/item"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/80'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-semibold text-slate-800 text-[15px] mb-1">{product.name}</h4>
                      <p className="text-slate-500 text-xs line-clamp-2 mb-2 leading-relaxed">
                        {product.description}
                      </p>
                      <p className="text-indigo-600 font-bold text-sm">
                        Rp {product.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Search className="w-10 h-10 text-slate-300 mb-3" />
                <p>Tidak ada koleksi yang cocok dengan deskripsi tersebut.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
