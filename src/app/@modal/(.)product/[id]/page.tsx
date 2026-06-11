import React from "react";
import ProductModalContent from "@/app/@modal/(.)product/[id]/ProductModalContent";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: PageProps) {
    return <ProductModalContent params={params} />;
}