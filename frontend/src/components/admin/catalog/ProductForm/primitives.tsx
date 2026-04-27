"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import type { FieldErrors, FieldError } from "react-hook-form";

export function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

interface FieldShellProps {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: { value: number; max: number };
  children: ReactNode;
}

export function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  counter,
  children,
}: FieldShellProps) {
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id ? `${id}-hint` : undefined;
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-800"
          >
            {label}
            {required ? <span className="ml-0.5 text-red-600">*</span> : null}
          </label>
          {counter ? <CharCounter {...counter} /> : null}
        </div>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="mt-1 flex items-start gap-1 text-sm text-red-600"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function CharCounter({ value, max }: { value: number; max: number }) {
  const ratio = value / max;
  const tone =
    ratio >= 1
      ? "text-red-600"
      : ratio >= 0.9
        ? "text-amber-600"
        : "text-gray-400";
  return (
    <span className={`text-xs tabular-nums ${tone}`}>
      {value}/{max}
    </span>
  );
}

const inputBase =
  "block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2";
const inputOk = "border-gray-300 focus:border-blue-500 focus:ring-blue-200";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-red-200";

type TextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: { value: number; max: number };
  rightAdornment?: ReactNode;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { label, required, hint, error, counter, id, rightAdornment, ...rest },
    ref
  ) {
    const generated = useId();
    const fieldId = id || generated;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        required={required}
        hint={hint}
        error={error}
        counter={counter}
      >
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={`${inputBase} ${error ? inputErr : inputOk} ${
              rightAdornment ? "pr-16" : ""
            }`}
            {...rest}
          />
          {rightAdornment ? (
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              {rightAdornment}
            </div>
          ) : null}
        </div>
      </FieldShell>
    );
  }
);

type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "className"
> & {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: { value: number; max: number };
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    { label, required, hint, error, counter, id, ...rest },
    ref
  ) {
    const generated = useId();
    const fieldId = id || generated;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        required={required}
        hint={hint}
        error={error}
        counter={counter}
      >
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${inputBase} ${error ? inputErr : inputOk}`}
          {...rest}
        />
      </FieldShell>
    );
  }
);

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "className"
> & {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, required, hint, error, id, children, ...rest },
    ref
  ) {
    const generated = useId();
    const fieldId = id || generated;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        required={required}
        hint={hint}
        error={error}
      >
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${inputBase} ${error ? inputErr : inputOk}`}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  }
);

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ id, label, description, ...rest }, ref) {
    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...rest}
        />
        <label htmlFor={id} className="select-none">
          <span className="block text-sm font-medium text-gray-800">{label}</span>
          {description ? (
            <span className="block text-xs text-gray-500">{description}</span>
          ) : null}
        </label>
      </div>
    );
  }
);

interface FlatError {
  path: string;
  label: string;
  message: string;
}

function flattenErrors(
  errors: FieldErrors,
  parentPath: string[] = [],
  parentLabels: string[] = []
): FlatError[] {
  const out: FlatError[] = [];
  for (const key of Object.keys(errors)) {
    const value = (errors as Record<string, unknown>)[key];
    if (!value) continue;
    const isArrayIndex = /^\d+$/.test(key);
    const path = [...parentPath, key];
    const labels = isArrayIndex
      ? [...parentLabels.slice(0, -1), `${parentLabels.at(-1) ?? ""} #${Number(key) + 1}`]
      : [...parentLabels, prettyLabel(key)];

    const node = value as { message?: string; type?: string } & Record<
      string,
      unknown
    >;
    if (typeof node.message === "string" && node.message.length > 0) {
      out.push({
        path: path.join("."),
        label: labels.filter(Boolean).join(" · "),
        message: node.message,
      });
    }
    // recurse into nested children (RHF errors are nested objects)
    for (const subKey of Object.keys(node)) {
      if (subKey === "message" || subKey === "type" || subKey === "ref") continue;
      const child = (node as Record<string, unknown>)[subKey];
      if (child && typeof child === "object") {
        out.push(
          ...flattenErrors(
            { [subKey]: child } as FieldErrors,
            path,
            labels
          )
        );
      }
    }
  }
  return out;
}

const LABEL_OVERRIDES: Record<string, string> = {
  sku: "SKU",
  seo_title: "SEO title",
  short_description: "Short description",
  product_type: "Product type",
  published_status: "Status",
  brand_id: "Brand",
  is_active: "Active",
  is_featured: "Featured",
  is_upcoming: "Upcoming",
  call_for_price: "Call for price",
  compare_at_price: "Compare-at price",
  cost_price: "Cost price",
  warehouse_id: "Warehouse",
  attribute_id: "Attribute",
  attribute_value_id: "Attribute value",
  attribute_values: "Attribute",
  simple_pricing: "Pricing",
};

function prettyLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ErrorSummary({
  errors,
  serverMessage,
}: {
  errors: FieldErrors;
  serverMessage?: string | null;
}) {
  const flat = flattenErrors(errors);
  if (flat.length === 0 && !serverMessage) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-semibold">
            {serverMessage
              ? serverMessage
              : `Please fix ${flat.length} ${
                  flat.length === 1 ? "issue" : "issues"
                } before saving.`}
          </p>
          {flat.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {flat.map((e) => (
                <li key={e.path}>
                  <button
                    type="button"
                    className="text-left text-red-700 underline-offset-2 hover:underline"
                    onClick={() => {
                      const el =
                        document.getElementById(e.path) ||
                        document.querySelector(`[name="${e.path}"]`);
                      if (el && "scrollIntoView" in el) {
                        (el as HTMLElement).scrollIntoView({
                          block: "center",
                          behavior: "smooth",
                        });
                        (el as HTMLElement).focus?.();
                      }
                    }}
                  >
                    <span className="font-medium">{e.label}:</span>{" "}
                    <span>{e.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper for outside callers that want the same flattening.
export function flattenFieldErrors(errors: FieldErrors) {
  return flattenErrors(errors);
}

// Tiny helper to read a single FieldError message from a possibly-nested
// errors tree by dotted path. Used by section components.
export function getFieldErrorMessage(
  errors: FieldErrors,
  path: string
): string | undefined {
  const parts = path.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  const node = cur as FieldError | undefined;
  return typeof node?.message === "string" ? node.message : undefined;
}

export function StickyActionBar({
  isSubmitting,
  isDirty,
  cancelHref,
  submitLabel,
  submittingLabel,
}: {
  isSubmitting: boolean;
  isDirty: boolean;
  cancelHref: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex items-center justify-between gap-3 border-t border-gray-200 bg-white/90 px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="text-xs text-gray-500">
        {isDirty ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        ) : (
          <span className="text-gray-400">All changes saved</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={cancelHref}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  );
}
