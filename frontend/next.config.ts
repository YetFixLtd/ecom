import type { NextConfig } from "next";

// Helper function to safely parse URL and extract hostname and port
function parseUrl(url: string): {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
} | null {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http") ? url : `http://${url}`;
    const parsed = new URL(urlWithProtocol);
    return {
      protocol: parsed.protocol === "https:" ? "https" : "http",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    };
  } catch {
    return null;
  }
}

const remotePatterns: Array<{
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
}> = [
  // Default localhost configuration
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "localhost",
    port: "8000",
    pathname: "/**",
  },
];

// Add API URL hostname if configured
if (process.env.NEXT_PUBLIC_API_URL) {
  const parsed = parseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (parsed) {
    remotePatterns.push({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: "/**",
    });
  }
}

// Add image base URL hostname if configured
if (process.env.NEXT_PUBLIC_IMAGE_BASE_URL) {
  const parsed = parseUrl(process.env.NEXT_PUBLIC_IMAGE_BASE_URL);
  if (parsed) {
    remotePatterns.push({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: "/**",
    });
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // Disable image optimization in development to avoid 400 errors
    // Images will be served directly from the backend
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
