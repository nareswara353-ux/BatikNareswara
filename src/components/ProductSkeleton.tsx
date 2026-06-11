import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col border border-slate-50 relative isolate w-full">
      {/* Area Foto - Shimmer */}
      <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
      </div>

      {/* Area Detail Info - Shimmer */}
      <div className="p-4 flex flex-col flex-grow bg-white z-10 space-y-3">
        {/* Title placeholder */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded-md w-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <div className="h-4 bg-slate-100 rounded-md w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>

        {/* Price placeholder */}
        <div className="flex flex-col gap-1 mt-auto pt-2">
          <div className="h-4 bg-slate-100 rounded-md w-1/2 relative overflow-hidden">
             <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          <div className="h-3 bg-slate-100 rounded-md w-1/3 relative overflow-hidden mt-0.5">
             <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </div>
      
      {/* Global CSS for shimmer added if not already existing */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `
      }} />
    </div>
  );
}