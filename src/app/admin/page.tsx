"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
// Native <img> tags are used throughout to bypass Next.js Image optimization 400 errors

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Inline Base64 Fallback SVG (prevents any additional network requests) ---
const FALLBACK_SVG_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";

const FALLBACK_PROFILE_SVG_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iOCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrIE5hcmVzd2FyYTwvdGV4dD48L3N2Zz4=";

// --- Type Definitions ---
interface ProductVariant {
  id?: string | number;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  price?: number;
  stock?: number;
  category?: string;
  image?: string;
  imageUrl?: string;
  primaryImage?: string;
  variants?: ProductVariant[];
  [key: string]: unknown;
}

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  // Defaulting to an environment variable configured for the .NET API
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      document.cookie = 'sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/');
    } catch (err) {
      console.warn('Error signing out:', err);
    }
  };

  // 1. Fetch live inventory on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ ADMIN FETCH: Try /admin/products first (eager-loaded variants), fallback to /products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primary: admin endpoint with .Include(p => p.Variants) eager loading
      let res = await fetch(`${API_URL}/admin/products`).catch(() => null);

      // Fallback: public products endpoint (also returns variants via DTO projection)
      if (!res || !res.ok) {
        res = await fetch(`${API_URL}/products`);
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.statusText}`);
      }

      const data = await res.json();
      const productList: unknown[] = Array.isArray(data) ? data : (data as Record<string, unknown>).data as unknown[] || [];

      // Map defensively to normalize DTO field names from .NET (camelCase)
      const mapped: Product[] = productList.map((raw: unknown) => {
        const p = raw as Record<string, unknown>;
        // Extract variants from all possible EF Core casing patterns
        const rawVariants = (p.variants || p.Variants || p.productVariants || p.ProductVariants || []) as Record<string, unknown>[];
        const variants: ProductVariant[] = rawVariants.map((v: Record<string, unknown>) => ({
          id: v.id as string | number | undefined ?? v.Id as string | number | undefined,
          size: (v.size as string || v.Size as string || 'All Size'),
          stock: v.stock !== undefined ? Number(v.stock) : Number(v.Stock || 0),
        }));

        // Resolve image: DTO uses 'primaryImage', raw entity might use 'imageUrl' or 'image'
        const imageUrl = (p.primaryImage || p.PrimaryImage || p.imageUrl || p.ImageUrl || p.image || p.Image || '') as string;

        return {
          id: String(p.id || p.Id || ''),
          title: String(p.title || p.Title || 'Untitled'),
          description: String(p.description || p.Description || ''),
          originalPrice: Number(p.originalPrice || p.OriginalPrice || 0),
          discountPrice: Number(p.discountPrice || p.DiscountPrice || 0),
          price: Number(p.price || p.Price || 0),
          stock: Number(p.stock || p.Stock || 0),
          category: String(p.category || p.Category || ''),
          imageUrl: imageUrl,
          primaryImage: imageUrl,
          image: imageUrl,
          variants: variants,
        };
      });

      setProducts(mapped);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("Server offline, menggunakan data simulasi Batik Nareswara.", message);
      setError('Koneksi ke server gagal. Menggunakan data simulasi (dummy).');

      // Data dummy SSS-Grade: 100% kontrak komponen hilir terpenuhi
      setProducts([
        {
          id: '1',
          title: "Batik Nareswara Kebaya Premium",
          price: 350000,
          originalPrice: 450000,
          discountPrice: 350000,
          stock: 12,
          category: "Kebaya",
          description: "Batik kualitas premium sutra asli Nareswara",
          image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600",
          imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600",
          primaryImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600",
          variants: [
            { id: 'v1', size: 'Standard', stock: 12 }
          ]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`Failed to delete product: ${res.statusText}`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Failed to delete product in backend:', message);
      // Fallback: hapus data di UI untuk demo
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert('Mode Offline: Produk dihapus dari tampilan.');
    }
  };

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    try {
      const form = e.currentTarget;
      const rawFormData = new FormData(form);

      // --- Construct form state manually ---
      const productForm = {
        title: rawFormData.get('title') as string,
        description: rawFormData.get('description') as string,
        category: (rawFormData.get('category') as string) || 'Kebaya',
        originalPrice: rawFormData.get('originalPrice'),
        discountPrice: rawFormData.get('discountPrice'),
        variants: [
          { size: 'S', stock: rawFormData.get('stock_S') },
          { size: 'M', stock: rawFormData.get('stock_M') },
          { size: 'L', stock: rawFormData.get('stock_L') },
          { size: 'XL', stock: rawFormData.get('stock_XL') },
        ]
      };

      const formData = new FormData();
      formData.append('Title', String(productForm.title || ''));
      formData.append('Description', String(productForm.description || ''));
      formData.append('Category', String(productForm.category || ''));
      formData.append('OriginalPrice', String(Number(productForm.originalPrice || 0)));
      formData.append('DiscountPrice', String(Number(productForm.discountPrice || 0)));

      const imageFiles = rawFormData.getAll('images') as File[];
      if (imageFiles.length > 0 && imageFiles[0].size > 0) {
        formData.append('ImageFile', imageFiles[0]);
      }

      productForm.variants.forEach((v, index) => {
        formData.append(`Variants[${index}].Size`, String(v.size));
        formData.append(`Variants[${index}].Stock`, String(parseInt((v.stock || 0).toString(), 10) || 0));
      });

      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to create product: ${res.statusText}`);
      }

      const newProduct: Product = await res.json();
      setProducts((prev) => [...prev, newProduct]);
      form.reset();
      alert('Product created successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Failed to create product in backend:', message);
      alert('Mode Offline: Tidak dapat menambahkan produk ke server.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleStorySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingStory(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const res = await fetch(`${API_URL}/admin/stories`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to publish story: ${res.statusText}`);
      }

      form.reset();
      alert('Story published successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Failed to publish story:', message);
      alert('Mode Offline: Tidak dapat mempublikasi story ke server.');
    } finally {
      setIsSubmittingStory(false);
    }
  };

  // ✅ Case-insensitive stock calculator: covers all EF Core property naming variants
  const getTotalStock = (product: Record<string, unknown>): number => {
    if (!product) return 0;

    // Scan all possible property name variations returned by .NET Entity Framework
    const actualVariants = (
      product.variants ||
      product.Variants ||
      product.productVariants ||
      product.ProductVariants ||
      product.product_variants ||
      []
    ) as Record<string, unknown>[];

    return actualVariants.reduce((sum: number, v: Record<string, unknown>) => {
      const stockValue = v.stock !== undefined ? v.stock : (v.Stock !== undefined ? v.Stock : 0);
      return sum + Number(stockValue);
    }, 0);
  };

  const formatRupiah = (value: number) => {
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  /**
   * Resolves the best available product image URL.
   * Falls back to an inline SVG to prevent any network 400 errors.
   */
  const getProductImage = (product: Product): string => {
    return product.primaryImage || product.imageUrl || product.image || FALLBACK_SVG_BASE64;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center">
            <div className="relative w-12 h-12 rounded-full mr-4 shadow-sm overflow-hidden bg-slate-200 border border-slate-300">
              <img
                src="/BatikNareswara Profile.jpg"
                alt="Batik Nareswara Profile"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_PROFILE_SVG_BASE64;
                }}
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Admin Batik Nareswara</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Panel
          </button>
        </header>

        {/* Top Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Publisher Form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Publish New Product</h2>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Product Title</label>
                  <input type="text" id="title" name="title" required className="w-full rounded-lg border border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm outline-none transition-colors" placeholder="e.g. Kemeja Batik Parang" />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Filosofi Motif (Description)</label>
                  <textarea id="description" name="description" rows={4} required className="w-full rounded-lg border border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm outline-none transition-colors resize-y" placeholder="Detail the meaning and cultural story behind the motif..." />
                </div>

                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-700 mb-1">Original Price (IDR)</label>
                  <input type="number" id="originalPrice" name="originalPrice" min="0" required className="w-full rounded-lg border border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm outline-none transition-colors" placeholder="0" />
                </div>
                <div>
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-slate-700 mb-1">Discount Price (IDR) <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="number" id="discountPrice" name="discountPrice" min="0" className="w-full rounded-lg border border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 text-sm outline-none transition-colors" placeholder="0" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Variant Stock Allocation</label>
                  <div className="grid grid-cols-4 gap-4">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <div key={size}>
                        <label htmlFor={`stock_${size}`} className="block text-xs font-semibold text-slate-500 mb-1 text-center">Size {size}</label>
                        <input type="number" id={`stock_${size}`} name={`stock_${size}`} min="0" defaultValue="0" required className="w-full rounded-lg border border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-center text-sm outline-none transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="images" className="block text-sm font-medium text-slate-700 mb-1">Product Images</label>
                  <input type="file" id="images" name="images" accept="image/*" multiple required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 p-2 border border-slate-300 rounded-lg outline-none cursor-pointer transition-colors" />
                  <p className="mt-2 text-xs text-slate-500">Select multiple local image files to upload alongside the product data.</p>
                </div>
              </div>

              <div className="pt-5 flex justify-end border-t border-slate-100 mt-6">
                <button type="submit" disabled={isSubmittingProduct} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isSubmittingProduct ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>



        </div>

        {/* Live Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Live Inventory Catalog</h2>
            <button type="button" onClick={fetchProducts} disabled={isLoading} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gambar</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Title</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Original Price</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Price</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Total Stock</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">Loading inventory data...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                          {error}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">No products found in the catalog.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      {/* 📸 KOLOM GAMBAR PRODUK (ANTI-CRASH, native <img>) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center">
                          <img
                            src={getProductImage(product)}
                            alt={product.title || "Gambar Produk"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_SVG_BASE64;
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-6 text-sm font-medium text-slate-900 whitespace-nowrap">{product.title}</td>
                      <td className="py-4 px-6 text-sm text-slate-500 whitespace-nowrap">{formatRupiah(product.originalPrice)}</td>
                      <td className="py-4 px-6 text-sm text-emerald-600 whitespace-nowrap">
                        {product.discountPrice > 0 ? formatRupiah(product.discountPrice) : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 text-center font-medium">
                        {getTotalStock(product as unknown as Record<string, unknown>)}
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700 font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-red-50 text-xs uppercase tracking-wide"
                        >
                          Hapus Produk
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
