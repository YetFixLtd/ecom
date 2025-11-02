/**
 * Image URL utility functions
 * Constructs full image URLs from relative paths using environment variables
 */

/**
 * Get the base URL for images from environment variables
 * Falls back to localhost:8000 if not set
 */
export function getImageBaseUrl(): string {
  // Check for image-specific base URL first, then fall back to API URL (without /api/v1)
  const imageBaseUrl =
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  // Remove trailing slash if present
  return imageBaseUrl.replace(/\/$/, "");
}

/**
 * Constructs a full image URL from a relative path
 *
 * @param imagePath - The image path (relative or absolute)
 * @returns The full image URL
 *
 * @example
 * getImageUrl("/storage/products/image.jpg")
 * // Returns: "http://localhost:8000/storage/products/image.jpg"
 *
 * @example
 * getImageUrl("http://example.com/image.jpg")
 * // Returns: "http://example.com/image.jpg" (already a full URL)
 *
 * @example
 * getImageUrl(null) or getImageUrl("")
 * // Returns: "" (empty string for missing images)
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  // Return empty string if no path provided
  if (!imagePath || imagePath.trim() === "") {
    return "";
  }

  // If it's already a full URL (starts with http:// or https://), return as-is
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath;
  }

  // Get base URL
  const baseUrl = getImageBaseUrl();

  // Remove leading slash from path if present (we'll add it)
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  // Construct full URL
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get image URL with fallback support
 * Tries multiple paths in order and returns the first valid one
 *
 * @param paths - Array of image paths to try
 * @returns The first valid image URL, or empty string if none found
 *
 * @example
 * getImageUrlWithFallback([product.image.url, product.image.path_original, product.image.path_medium])
 */
export function getImageUrlWithFallback(
  ...paths: Array<string | null | undefined>
): string {
  for (const path of paths) {
    const url = getImageUrl(path);
    if (url) {
      return url;
    }
  }
  return "";
}
