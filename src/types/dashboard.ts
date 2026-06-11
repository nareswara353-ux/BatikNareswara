// src/types/dashboard.ts

export const NOMOR_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export interface ProductSize {
    size: string;
    stock: number;
}

export interface Product {
    category: string;
    id: string;
    title: string;
    description: string;
    originalPrice: number;
    discountPrice: number | null;
    primaryImage: string;
    galleryImages?: string[];
    variants?: any[];
    createdAt?: string;
    filosofi?: string;
    images?: string[];
    rating?: number;
    soldCount?: number;
    sizes?: string[];
    isAvailable?: boolean;
}

export interface Story {
    id: string;
    mediaUrl: string;
    media: string;
    type: "image" | "video";
    productId?: string;
}

export interface CartItem {
    product: Product;
    selectedSize: string;
    quantity: number;
}