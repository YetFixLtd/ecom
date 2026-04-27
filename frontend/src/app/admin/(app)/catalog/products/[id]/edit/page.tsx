"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import ProductForm from "@/components/admin/catalog/ProductForm";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { getProduct, type Product } from "@/lib/apis/products";

export default function EditProductPage() {
  const params = useParams();
  const productId = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) {
          setError("Not authenticated.");
          return;
        }
        const res = await getProduct(token, productId, {
          with_variants: true,
          with_inventory: false,
        });
        if (!cancelled) setProduct(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (productId) load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Product not found."}
        </div>
        <Link
          href="/admin/catalog/products"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      productId={productId}
      initialProduct={product}
    />
  );
}
