interface BottomNavProps {
    onNavHome: () => void;
    onNavExplore: () => void;
    onOpenWishlist: () => void;
    onOpenCart: () => void;
    wishlistCount: number;
    cartCount: number;
}

export default function BottomNav({
    onNavHome,
    onNavExplore,
    onOpenWishlist,
    onOpenCart,
    wishlistCount,
    cartCount,
}: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.08)]">
            <div className="max-w-md mx-auto flex justify-around px-2 py-3 pb-safe">
                <button onClick={onNavHome} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-[#D2691E] transition-colors group">
                    <div className="p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                </button>

                <button onClick={onNavExplore} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-[#D2691E] transition-colors group">
                    <div className="p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
                </button>

                <button onClick={onOpenWishlist} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-[#D2691E] transition-colors group relative">
                    <div className="p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {wishlistCount > 0 && (
                            <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                {wishlistCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Wishlist</span>
                </button>

                <button onClick={onOpenCart} className="flex flex-col items-center gap-1.5 w-16 text-slate-400 hover:text-[#D2691E] transition-colors group relative">
                    <div className="p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
                </button>
            </div>
        </nav>
    );
}