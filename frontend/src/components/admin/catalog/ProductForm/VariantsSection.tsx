"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X, AlertCircle } from "lucide-react";
import type { Attribute } from "@/lib/apis/attributes";
import type { Warehouse } from "@/lib/apis/inventory";
import { Card, Checkbox, Select, TextInput, getFieldErrorMessage } from "./primitives";
import { InventoryGrid } from "./InventoryGrid";
import type { VariantFormValue, VariantInventoryValue } from "./schema";
import type { FieldErrors } from "react-hook-form";

interface VariantsSectionProps {
  variants: VariantFormValue[];
  setVariants: React.Dispatch<React.SetStateAction<VariantFormValue[]>>;
  attributes: Attribute[];
  warehouses: Warehouse[];
  errors?: FieldErrors;
  /** When true, hide initial-inventory grid for variants that already have an id (existing) */
  hideExistingInventory?: boolean;
}

export function VariantsSection({
  variants,
  setVariants,
  attributes,
  warehouses,
  errors,
  hideExistingInventory,
}: VariantsSectionProps) {
  const [editing, setEditing] = useState<number | null>(null);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        price: 0,
        track_stock: true,
        allow_backorder: false,
        status: "active",
        attribute_values: [],
        inventory: [],
      },
    ]);
    setEditing(variants.length);
  };

  const updateVariant = (i: number, patch: Partial<VariantFormValue>) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const removeVariant = (i: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
    setEditing((cur) => {
      if (cur === i) return null;
      if (cur != null && cur > i) return cur - 1;
      return cur;
    });
  };

  return (
    <Card
      title="Variants"
      description="Each variant has its own SKU, price, and inventory."
      action={
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add variant
        </button>
      }
    >
      {variants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No variants yet. Click <span className="font-medium">Add variant</span> to create one.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {variants.map((v, i) => {
            const variantErrors = (errors?.variants as FieldErrors | undefined)?.[
              i as unknown as string
            ] as FieldErrors | undefined;
            const hasError = !!variantErrors && Object.keys(variantErrors).length > 0;
            return (
              <li
                key={v.id ?? `new-${i}`}
                id={`variants.${i}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {v.sku || <span className="italic text-gray-400">no SKU</span>}
                    </span>
                    {v.id ? (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        ID {v.id}
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        New
                      </span>
                    )}
                    {hasError ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    ${v.price ?? 0}
                    {v.attribute_values && v.attribute_values.length > 0
                      ? " · " +
                        v.attribute_values
                          .map((av) => {
                            const a = attributes.find((x) => x.id === av.attribute_id);
                            const val = a?.values?.find(
                              (vv) => vv.id === av.attribute_value_id
                            );
                            return val ? `${a?.name}: ${val.value}` : "";
                          })
                          .filter(Boolean)
                          .join(", ")
                      : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(i)}
                    className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
                    aria-label="Edit variant"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <VariantEditorDrawer
        open={editing !== null}
        index={editing}
        variant={editing != null ? variants[editing] : null}
        onChange={(patch) => editing != null && updateVariant(editing, patch)}
        onClose={() => setEditing(null)}
        attributes={attributes}
        warehouses={warehouses}
        errors={errors}
        hideExistingInventory={hideExistingInventory}
      />
    </Card>
  );
}

interface DrawerProps {
  open: boolean;
  index: number | null;
  variant: VariantFormValue | null;
  onChange: (patch: Partial<VariantFormValue>) => void;
  onClose: () => void;
  attributes: Attribute[];
  warehouses: Warehouse[];
  errors?: FieldErrors;
  hideExistingInventory?: boolean;
}

function VariantEditorDrawer({
  open,
  index,
  variant,
  onChange,
  onClose,
  attributes,
  warehouses,
  errors,
  hideExistingInventory,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !variant || index === null) return null;

  const setAttr = (attributeId: number, valueId: number | null) => {
    const cur = variant.attribute_values || [];
    const filtered = cur.filter((av) => av.attribute_id !== attributeId);
    onChange({
      attribute_values: valueId
        ? [...filtered, { attribute_id: attributeId, attribute_value_id: valueId }]
        : filtered,
    });
  };

  const path = (sub: string) => `variants.${index}.${sub}`;
  const skuErr = errors ? getFieldErrorMessage(errors, path("sku")) : undefined;
  const priceErr = errors ? getFieldErrorMessage(errors, path("price")) : undefined;
  const compareErr = errors
    ? getFieldErrorMessage(errors, path("compare_at_price"))
    : undefined;
  const showInventory =
    !hideExistingInventory || !variant.id;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={`Edit variant ${index + 1}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Variant {index + 1}
            </h3>
            {variant.id ? (
              <p className="text-xs text-gray-500">Existing variant · ID {variant.id}</p>
            ) : (
              <p className="text-xs text-emerald-700">New variant</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <TextInput
            label="SKU"
            required
            id={path("sku")}
            value={variant.sku || ""}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="e.g., SHIRT-RED-L"
            error={skuErr}
          />

          {attributes.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-800">Attributes</p>
              {attributes.map((attr) => {
                const sel = variant.attribute_values?.find(
                  (av) => av.attribute_id === attr.id
                );
                return (
                  <Select
                    key={attr.id}
                    label={attr.name}
                    value={sel?.attribute_value_id ?? ""}
                    onChange={(e) =>
                      setAttr(
                        attr.id,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">— Select {attr.name} —</option>
                    {attr.values?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.value}
                      </option>
                    ))}
                  </Select>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Price"
              required
              id={path("price")}
              type="number"
              step="0.01"
              min="0"
              value={variant.price ?? ""}
              onChange={(e) =>
                onChange({
                  price: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              error={priceErr}
            />
            <TextInput
              label="Compare-at"
              id={path("compare_at_price")}
              type="number"
              step="0.01"
              min="0"
              value={variant.compare_at_price ?? ""}
              onChange={(e) =>
                onChange({
                  compare_at_price:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              error={compareErr}
            />
            <TextInput
              label="Cost"
              type="number"
              step="0.01"
              min="0"
              value={variant.cost_price ?? ""}
              onChange={(e) =>
                onChange({
                  cost_price:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
            <TextInput
              label="Currency"
              maxLength={3}
              value={variant.currency ?? ""}
              onChange={(e) =>
                onChange({ currency: e.target.value.toUpperCase() || undefined })
              }
              placeholder="BDT"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Checkbox
              id={`v-${index}-track`}
              label="Track stock"
              checked={variant.track_stock ?? true}
              onChange={(e) => onChange({ track_stock: e.target.checked })}
            />
            <Checkbox
              id={`v-${index}-back`}
              label="Allow backorder"
              checked={variant.allow_backorder ?? false}
              onChange={(e) => onChange({ allow_backorder: e.target.checked })}
            />
          </div>

          {showInventory && (variant.track_stock ?? true) ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">
                Initial inventory by warehouse
              </p>
              <InventoryGrid
                warehouses={warehouses}
                inventory={variant.inventory || []}
                onChange={(next: VariantInventoryValue[]) =>
                  onChange({ inventory: next })
                }
              />
            </div>
          ) : null}
        </div>

        <footer className="border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        </footer>
      </aside>
    </>
  );
}
