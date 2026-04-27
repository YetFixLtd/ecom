import { z } from "zod";
import type { Attribute } from "@/lib/apis/attributes";

export const variantInventorySchema = z.object({
  warehouse_id: z.number().int().positive(),
  on_hand: z.number().nonnegative().optional(),
  safety_stock: z.number().nonnegative().optional(),
  reorder_point: z.number().nonnegative().optional(),
});

export const variantAttributeValueSchema = z.object({
  attribute_id: z.number().int().positive(),
  attribute_value_id: z.number().int().positive(),
});

export const variantSchema = z.object({
  id: z.number().int().positive().optional(),
  sku: z.string().trim().min(1, "SKU is required.").max(100, "SKU too long."),
  price: z
    .number({ message: "Price is required." })
    .nonnegative("Price must be 0 or greater."),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  cost_price: z.number().nonnegative().nullable().optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code.")
    .optional(),
  track_stock: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  status: z.string().optional(),
  attribute_values: z.array(variantAttributeValueSchema).optional(),
  inventory: z.array(variantInventorySchema).optional(),
});

export const simplePricingSchema = z.object({
  variant_id: z.number().nullable().optional(),
  sku: z.string().trim().min(1, "SKU is required for simple products."),
  price: z
    .number({ message: "Price is required." })
    .positive("Price must be greater than 0."),
  compare_at_price: z.number().nonnegative().nullable().optional(),
  cost_price: z.number().nonnegative().nullable().optional(),
  track_stock: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  status: z.string().optional(),
  currency: z.string().optional(),
  inventory: z.array(variantInventorySchema).optional(),
});

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(255, "Name must be 255 characters or less."),
  slug: z
    .string()
    .trim()
    .max(255)
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and hyphens.")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  short_description: z
    .string()
    .max(500, "Short description must be 500 characters or less.")
    .optional()
    .or(z.literal("")),
  product_type: z.enum(["simple", "variant", "bundle"]),
  brand_id: z.number().nullable().optional(),
  published_status: z.enum(["draft", "published", "archived"]),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_upcoming: z.boolean().optional(),
  call_for_price: z.boolean().optional(),
  categories: z.array(z.number()).optional(),
  simple_pricing: simplePricingSchema.optional(),
  variants: z.array(variantSchema).optional(),
});

export type ProductFormValues = z.infer<typeof baseSchema>;
export type VariantFormValue = z.infer<typeof variantSchema>;
export type SimplePricingValue = z.infer<typeof simplePricingSchema>;
export type VariantInventoryValue = z.infer<typeof variantInventorySchema>;

export interface SchemaContext {
  attributes: Attribute[];
}

export function buildProductSchema(ctx: SchemaContext) {
  return baseSchema.superRefine((data, refinement) => {
    if (data.product_type === "simple") {
      if (!data.simple_pricing) {
        refinement.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["simple_pricing", "sku"],
          message: "SKU is required for simple products.",
        });
        return;
      }
      const sp = data.simple_pricing;
      if (
        sp.compare_at_price != null &&
        sp.price != null &&
        sp.compare_at_price < sp.price
      ) {
        refinement.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["simple_pricing", "compare_at_price"],
          message: "Compare-at price must be greater than or equal to price.",
        });
      }
      const seenWh = new Set<number>();
      sp.inventory?.forEach((inv, i) => {
        if (seenWh.has(inv.warehouse_id)) {
          refinement.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["simple_pricing", "inventory", i, "warehouse_id"],
            message: "Duplicate warehouse for this product.",
          });
        }
        seenWh.add(inv.warehouse_id);
      });
    }

    if (data.product_type === "variant") {
      if (!data.variants || data.variants.length === 0) {
        refinement.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "Add at least one variant.",
        });
        return;
      }
      const seenSku = new Map<string, number>();
      data.variants.forEach((v, i) => {
        const skuKey = (v.sku || "").trim().toLowerCase();
        if (skuKey) {
          if (seenSku.has(skuKey)) {
            refinement.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", i, "sku"],
              message: `Duplicate SKU (also used by variant #${
                (seenSku.get(skuKey) ?? 0) + 1
              }).`,
            });
          } else {
            seenSku.set(skuKey, i);
          }
        }
        if (
          v.compare_at_price != null &&
          v.price != null &&
          v.compare_at_price < v.price
        ) {
          refinement.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["variants", i, "compare_at_price"],
            message: "Compare-at price must be greater than or equal to price.",
          });
        }
        const seenWh = new Set<number>();
        v.inventory?.forEach((inv, j) => {
          if (seenWh.has(inv.warehouse_id)) {
            refinement.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", i, "inventory", j, "warehouse_id"],
              message: "Duplicate warehouse for this variant.",
            });
          }
          seenWh.add(inv.warehouse_id);
        });
        const seenAttr = new Set<number>();
        v.attribute_values?.forEach((av, j) => {
          if (seenAttr.has(av.attribute_id)) {
            refinement.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", i, "attribute_values", j, "attribute_id"],
              message: "Each attribute may only be set once per variant.",
            });
          }
          seenAttr.add(av.attribute_id);
          const attr = ctx.attributes.find((a) => a.id === av.attribute_id);
          if (!attr) return;
          const owns = attr.values?.some(
            (val) => val.id === av.attribute_value_id
          );
          if (!owns) {
            refinement.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["variants", i, "attribute_values", j, "attribute_value_id"],
              message: "Selected value does not belong to this attribute.",
            });
          }
        });
      });
    }
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

/**
 * Convert Laravel dotted error keys (e.g. "variants.0.sku") into RHF field
 * paths verbatim. The previous implementation converted dots to underscores,
 * which never matched a registered field.
 */
export function mapServerErrors(
  serverErrors: Record<string, string[] | undefined> | undefined,
  setError: (path: string, error: { type: string; message: string }) => void
): { count: number; firstPath: string | null } {
  let count = 0;
  let firstPath: string | null = null;
  if (!serverErrors) return { count, firstPath };
  for (const [field, messages] of Object.entries(serverErrors)) {
    if (!messages || messages.length === 0) continue;
    const path = field;
    setError(path, { type: "server", message: messages[0] });
    if (firstPath === null) firstPath = path;
    count += 1;
  }
  return { count, firstPath };
}

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MAX_COUNT = 50;
export const IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
