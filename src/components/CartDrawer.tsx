// Native <img> used to bypass Next.js Image optimization 400 errors

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: any[];
    setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
    totalPrice: number;
    onCheckout: () => void;
    onNavExplore: () => void;
}

export default function CartDrawer({
    isOpen,
    onClose,
    cartItems,
    setCartItems,
    totalPrice,
    onCheckout,
    onNavExplore,
}: CartDrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-t-3xl h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center border-b border-slate-100 p-6">
                    <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                        <svg className="w-6 h-6 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Keranjang Belanja ({cartItems.length})
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center my-auto">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-medium text-lg">Keranjang belanja kosong</p>
                            <p className="text-slate-400 text-sm mt-1">Mari temukan koleksi batik terbaik.</p>
                            <button
                                onClick={() => {
                                    onClose();
                                    onNavExplore();
                                }}
                                className="mt-6 bg-[#D2691E] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#b85c1a] transition-colors"
                            >
                                Mulai Belanja
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item: any, index: number) => {
                            const itemPrice = item.product.discountPrice || item.product.originalPrice || 0;
                            return (
                                <div key={index} className="flex gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                        <img
                                            src={item.product.primaryImage || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="}
                                            alt={item.product.title || "Product Image"}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.product.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Ukuran: <span className="font-bold text-[#D2691E]">{item.selectedSize}</span></p>
                                            <p className="text-xs text-slate-400">Jumlah: {item.quantity}x</p>
                                        </div>
                                        <p className="font-extrabold text-sm text-[#D2691E]">Rp {(itemPrice * item.quantity).toLocaleString("id-ID")}</p>
                                    </div>
                                    <button
                                        onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== index))}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1 my-auto"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-500">Total Pembayaran</span>
                            <span className="text-xl font-black text-[#D2691E]">Rp {totalPrice.toLocaleString("id-ID")}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-[#D2691E] text-white rounded-xl py-4 font-bold hover:bg-[#b85c1a] shadow-lg transition-all text-center block"
                        >
                            Lanjut ke Pembayaran
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}