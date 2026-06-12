"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  variants?: ProductVariant[];
  [key: string]: any;
}

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

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

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // ✅ BALIKIN KE RUTE ASLI: Karena rute /api/products sekarang sudah kebal eror loop
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.statusText}`);
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.data || []));
    } catch (err: any) {
      console.warn("Server offline, menggunakan data simulasi Batik Nareswara.", err.message);
      setError('Koneksi ke server gagal. Menggunakan data simulasi (dummy).');
      

      setProducts([
        {
          id: '1',
          title: "Batik Nareswara Kebaya Premium",
          price: 350000,
          originalPrice: 450000,
          discountPrice: 350000,
          category: "Kebaya",
          description: "Batik kualitas premium sutra asli Nareswara",
          imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600",
          variants: [
            { id: 'v1', size: 'XL', stock: 4 }
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
    } catch (err: any) {
      console.warn('Failed to delete product in backend:', err.message);
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

      // 🔥 TRIK SAPU JAGAT: Kirim double format biar Model Binding .NET pasti jebol tembus!
      productForm.variants.forEach((v, index) => {
        // 1. Format PascalCase (Bawaan standar C#)
        formData.append(`Variants[${index}].Size`, String(v.size));
        formData.append(`Variants[${index}].Stock`, String(parseInt((v.stock || 0).toString(), 10) || 0));

        // 2. Format camelCase (Antisipasi jika .NET lu sensitif huruf kecil)
        formData.append(`variants[${index}].size`, String(v.size));
        formData.append(`variants[${index}].stock`, String(parseInt((v.stock || 0).toString(), 10) || 0));
      });

      const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Failed to create product: ${res.statusText}`);
      }

      form.reset();
      alert('Product created successfully.');
      fetchProducts();
    } catch (err: any) {
      console.warn('Failed to create product in backend:', err.message);
      alert('Mode Offline: Tidak dapat menambahkan produk ke server.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const getTotalStock = (product: any) => {
    if (!product) return 0;
    const actualVariants = product.variants || 
                           product.Variants || 
                           product.productVariants || 
                           product.ProductVariants || 
                           product.product_variants || 
                           [];
                           
    return actualVariants.reduce((sum: number, v: any) => {
      const stockValue = v.stock !== undefined ? v.stock : (v.Stock !== undefined ? v.Stock : 0);
      return sum + Number(stockValue);
    }, 0);
  };

  const formatRupiah = (value: number) => {
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full mr-4 shadow-sm overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
              <img src="/BatikNareswara Profile.jpg" alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zz4="; }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Admin Batik Nareswara</h1>
          </div>
          <button onClick={handleSignOut} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2">
            Keluar Panel
          </button>
        </header>

        {/* Form */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800">Publish New Product</h2>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Product Title</label>
                  <input type="text" id="title" name="title" required className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none" placeholder="e.g. Kemeja Batik Parang" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Filosofi Motif (Description)</label>
                  <textarea id="description" name="description" rows={4} required className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none" placeholder="Detail the meaning..." />
                </div>
                <div>
                  <label htmlFor="originalPrice" className="block text-sm font-medium text-slate-700 mb-1">Original Price (IDR)</label>
                  <input type="number" id="originalPrice" name="originalPrice" min="0" required className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none" />
                </div>
                <div>
                  <label htmlFor="discountPrice" className="block text-sm font-medium text-slate-700 mb-1">Discount Price (IDR)</label>
                  <input type="number" id="discountPrice" name="discountPrice" min="0" className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-3">Variant Stock Allocation</label>
                  <div className="grid grid-cols-4 gap-4">
                    {['S', 'M', 'L', 'XL'].map((size) => (
                      <div key={size}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 text-center">Size {size}</label>
                        <input type="number" id={`stock_${size}`} name={`stock_${size}`} min="0" defaultValue="0" required className="w-full rounded-lg border border-slate-300 p-2 text-center text-sm outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="images" className="block text-sm font-medium text-slate-700 mb-1">Product Images</label>
                  <input type="file" id="images" name="images" accept="image/*" required className="block w-full text-sm text-slate-500 p-2 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="pt-5 flex justify-end border-t border-slate-100 mt-6">
                <button type="submit" disabled={isSubmittingProduct} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
                  {isSubmittingProduct ? 'Publishing...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Live Inventory Catalog</h2>
            <button type="button" onClick={fetchProducts} className="text-sm font-medium text-slate-600 hover:text-slate-900">Refresh Data</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Gambar</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Product Title</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Original Price</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Discount Price</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-center">Total Stock</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Loading inventory data...</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="py-8 text-center"><div className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block border border-amber-200">{error}</div></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">No products found.</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      {/* 📸 FIX: Ganti ke tag <img> murni, aman dari loop eror 400 Next Image */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm">
                          <img
                            src={product.imageUrl || product.image || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg=="}
                            alt={product.title || "Batik"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtc2l6ZT0iNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJhdGlrPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-900 whitespace-nowrap">{product.title}</td>
                      <td className="py-4 px-6 text-sm text-slate-500 whitespace-nowrap">{formatRupiah(product.originalPrice)}</td>
                      <td className="py-4 px-6 text-sm text-emerald-600 whitespace-nowrap">{product.discountPrice > 0 ? formatRupiah(product.discountPrice) : '-'}</td>
                      <td className="py-4 px-6 text-sm text-slate-500 text-center font-medium">{getTotalStock(product)}</td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button type="button" onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-700 font-medium text-xs uppercase tracking-wide">Hapus</button>
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