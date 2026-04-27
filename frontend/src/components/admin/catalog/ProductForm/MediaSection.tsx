"use client";

import { useState } from "react";
import { Star, Upload, X, AlertCircle } from "lucide-react";
import { Card } from "./primitives";
import {
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_COUNT,
} from "./schema";

export type ImageItem =
  | { type: "existing"; id: number; url: string; preview: string }
  | { type: "new"; file: File; preview: string; tempId: string };

interface MediaSectionProps {
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  primaryIndex: number;
  setPrimaryIndex: React.Dispatch<React.SetStateAction<number>>;
  onIngestErrors?: (errors: string[]) => void;
}

export function MediaSection({
  images,
  setImages,
  primaryIndex,
  setPrimaryIndex,
  onIngestErrors,
}: MediaSectionProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const ingest = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f): f is File => f instanceof File);
    if (arr.length === 0) return;
    const errs: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > IMAGE_MAX_BYTES) {
        errs.push(
          `${f.name}: ${(f.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit.`
        );
        continue;
      }
      if (!IMAGE_ALLOWED_TYPES.includes(f.type)) {
        errs.push(`${f.name}: ${f.type || "unknown"} not allowed (JPEG/PNG/WebP only).`);
        continue;
      }
      valid.push(f);
    }
    const remaining = IMAGE_MAX_COUNT - images.length;
    if (valid.length > remaining) {
      errs.push(
        `Only ${remaining} more image(s) allowed (max ${IMAGE_MAX_COUNT} per product).`
      );
      valid.splice(remaining);
    }
    if (errs.length > 0) {
      setErrors(errs);
      onIngestErrors?.(errs);
    } else {
      setErrors([]);
    }
    if (valid.length === 0) return;
    const items: ImageItem[] = valid.map((file) => ({
      type: "new" as const,
      file,
      preview: URL.createObjectURL(file),
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    }));
    setImages((prev) => [...prev, ...items]);
  };

  const removeImage = (idx: number) => {
    const item = images[idx];
    if (item.type === "new" && item.preview.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPrimaryIndex((prev) => {
      if (prev === idx) return 0;
      if (prev > idx) return prev - 1;
      return prev;
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    setPrimaryIndex((prev) => {
      if (prev === from) return to;
      if (from < prev && to >= prev) return prev - 1;
      if (from > prev && to <= prev) return prev + 1;
      return prev;
    });
  };

  return (
    <Card
      title="Media"
      description={`Up to ${IMAGE_MAX_COUNT} images. Drag to reorder. Star marks the primary.`}
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <Upload className="h-6 w-6 text-gray-400" />
        <span className="font-medium text-gray-700">
          Drop images or click to browse
        </span>
        <span className="text-xs text-gray-500">JPEG, PNG, WebP — up to 5MB each</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {errors.length > 0 ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Some files were not added
          </div>
          <ul className="list-disc space-y-0.5 pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setErrors([])}
            className="mt-2 text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-gray-600">
            {images.length} image{images.length === 1 ? "" : "s"} · drag thumbnails to reorder
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, index) => (
              <div
                key={img.type === "existing" ? `e-${img.id}` : `n-${img.tempId}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragIndex !== null) reorder(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`group relative cursor-move rounded-lg border bg-white p-1 transition ${
                  dragIndex === index ? "opacity-50" : "hover:shadow-md"
                } ${
                  primaryIndex === index ? "ring-2 ring-blue-500" : "border-gray-200"
                }`}
              >
                <img
                  src={img.preview}
                  alt={`Image ${index + 1}`}
                  className="h-32 w-full rounded object-cover"
                />
                <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                  {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => setPrimaryIndex(index)}
                  className={`absolute right-1 top-1 rounded-full p-1 transition ${
                    primaryIndex === index
                      ? "bg-blue-600 text-white"
                      : "bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white"
                  }`}
                  title={primaryIndex === index ? "Primary image" : "Set as primary"}
                >
                  <Star
                    className="h-4 w-4"
                    fill={primaryIndex === index ? "currentColor" : "none"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-1 text-white opacity-0 shadow group-hover:opacity-100 hover:bg-red-700"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
