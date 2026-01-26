"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, type AdminSettings } from "@/lib/apis/settings";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { Upload, X, Save } from "lucide-react";
import { getImageUrl } from "@/lib/utils/images";
import { AxiosError } from "axios";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({});
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [callForPricePhone, setCallForPricePhone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      const response = await getSettings(token);
      const data = response.data;

      // Extract values from the settings object
      setSiteName(data.site_name?.value || "");
      setSiteDescription(data.site_description?.value || "");
      setCallForPricePhone(data.call_for_price_phone?.value || "");
      
      if (data.site_logo_url?.value) {
        setLogoPreview(getImageUrl(data.site_logo_url.value));
      }
      
      if (data.site_favicon_url?.value) {
        setFaviconPreview(getImageUrl(data.site_favicon_url.value));
      }

      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview && !logoPreview.includes(process.env.NEXT_PUBLIC_API_URL || "")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(null);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    if (faviconPreview && !faviconPreview.includes(process.env.NEXT_PUBLIC_API_URL || "")) {
      URL.revokeObjectURL(faviconPreview);
    }
    setFaviconPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setSaving(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setErrorMessage("Not authenticated");
        return;
      }

      const updateData: any = {
        site_name: siteName,
        site_description: siteDescription,
        call_for_price_phone: callForPricePhone,
      };

      if (logoFile) {
        updateData.logo = logoFile;
      } else if (!logoPreview && settings.site_logo_url) {
        updateData.delete_logo = true;
      }

      if (faviconFile) {
        updateData.favicon = faviconFile;
      } else if (!faviconPreview && settings.site_favicon_url) {
        updateData.delete_favicon = true;
      }

      await updateSettings(token, updateData);
      setSuccessMessage("Settings updated successfully!");
      
      // Reload settings
      await loadSettings();
      
      // Clear file selections
      setLogoFile(null);
      setFaviconFile(null);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        setErrorMessage(error.response.data.message || "Failed to update settings");
      } else {
        setErrorMessage("Failed to update settings");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Website Settings</h1>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">General Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="My E-Commerce Store"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Site Description
              </label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="A brief description of your store"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Call for Price Phone Number
              </label>
              <input
                type="tel"
                value={callForPricePhone}
                onChange={(e) => setCallForPricePhone(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="+8801234567890"
              />
              <p className="mt-1 text-xs text-gray-500">
                Phone number to display when products have "Call for Price" enabled
              </p>
            </div>
          </div>
        </div>

        {/* Logo Settings */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Site Logo</h2>
          
          <div>
            <label className="mb-2 block text-sm font-medium">
              Logo Image
            </label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-32 rounded-md border object-contain"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-4 py-8 hover:border-gray-400">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  Click to upload logo
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  PNG, JPG, SVG up to 2MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Favicon Settings */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Favicon</h2>
          
          <div>
            <label className="mb-2 block text-sm font-medium">
              Favicon Image
            </label>
            {faviconPreview ? (
              <div className="relative inline-block">
                <img
                  src={faviconPreview}
                  alt="Favicon preview"
                  className="h-16 w-16 rounded-md border object-contain"
                />
                <button
                  type="button"
                  onClick={removeFavicon}
                  className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-4 py-8 hover:border-gray-400">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  Click to upload favicon
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  ICO, PNG up to 1MB (16x16 or 32x32)
                </span>
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

