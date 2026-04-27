"use client";

import type { Warehouse } from "@/lib/apis/inventory";
import type { VariantInventoryValue } from "./schema";

interface InventoryGridProps {
  warehouses: Warehouse[];
  inventory: VariantInventoryValue[];
  onChange: (next: VariantInventoryValue[]) => void;
  disabled?: boolean;
}

export function InventoryGrid({
  warehouses,
  inventory,
  onChange,
  disabled,
}: InventoryGridProps) {
  if (warehouses.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        No warehouses configured. Add a warehouse to seed inventory.
      </p>
    );
  }

  const update = (
    warehouseId: number,
    field: "on_hand" | "safety_stock" | "reorder_point",
    raw: string
  ) => {
    const value = raw === "" ? undefined : Number(raw);
    const idx = inventory.findIndex((i) => i.warehouse_id === warehouseId);
    let next: VariantInventoryValue[];
    if (idx >= 0) {
      next = [...inventory];
      next[idx] = { ...next[idx], [field]: value };
    } else {
      next = [...inventory, { warehouse_id: warehouseId, [field]: value }];
    }
    onChange(next);
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs font-medium text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Warehouse</th>
            <th className="px-3 py-2 text-left">On hand</th>
            <th className="px-3 py-2 text-left">Safety</th>
            <th className="px-3 py-2 text-left">Reorder</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {warehouses.map((w) => {
            const inv =
              inventory.find((i) => i.warehouse_id === w.id) ||
              ({} as VariantInventoryValue);
            return (
              <tr key={w.id}>
                <td className="px-3 py-1.5 font-medium text-gray-700">{w.name}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    disabled={disabled}
                    value={inv.on_hand ?? ""}
                    onChange={(e) => update(w.id, "on_hand", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    disabled={disabled}
                    value={inv.safety_stock ?? ""}
                    onChange={(e) => update(w.id, "safety_stock", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    disabled={disabled}
                    value={inv.reorder_point ?? ""}
                    onChange={(e) =>
                      update(w.id, "reorder_point", e.target.value)
                    }
                    className={inputCls}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
