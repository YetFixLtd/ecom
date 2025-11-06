"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { type Product } from "@/lib/apis/products";

interface Props {
  products: Product[];
  value: number | undefined;
  onChange: (variantId: number) => void;
  disabled?: boolean;
  error?: string;
}

export function SearchableVariantSelect({
  products,
  value,
  onChange,
  disabled = false,
  error,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Collect all variants from all products
  const allVariants = useMemo(() => {
    return products.flatMap((product) =>
      (product.variants || []).map((variant) => ({
        ...variant,
        productName: product.name,
        productId: product.id,
      }))
    );
  }, [products]);

  // Filter variants based on search term
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return allVariants;

    const term = searchTerm.toLowerCase();
    return allVariants.filter(
      (variant) =>
        variant.productName.toLowerCase().includes(term) ||
        variant.sku.toLowerCase().includes(term) ||
        variant.id.toString().includes(term)
    );
  }, [allVariants, searchTerm]);

  // Get selected variant
  const selectedVariant = useMemo(() => {
    return allVariants.find((v) => v.id === value);
  }, [allVariants, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (variantId: number) => {
    onChange(variantId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-600 ${
          error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={selectedVariant ? "text-gray-900" : "text-gray-500"}>
          {selectedVariant
            ? `${selectedVariant.productName} - ${selectedVariant.sku}`
            : "Select variant"}
        </span>
        <div className="flex items-center gap-1">
          {selectedVariant && !disabled && (
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-auto">
            {filteredVariants.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {allVariants.length === 0
                  ? "No variants available"
                  : "No variants found"}
              </div>
            ) : (
              filteredVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelect(variant.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                    value === variant.id ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="font-medium">{variant.productName}</div>
                  <div className="text-xs text-gray-500">
                    SKU: {variant.sku}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
