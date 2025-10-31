"use client";

import { getAdministrator, updateAdministrator } from "@/lib/admin-api";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, use } from "react";
import type { Administrator } from "@/types/admin";

export default function EditAdministratorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");
  const [admin, setAdmin] = useState<Administrator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdmin() {
      try {
        console.log("Loading admin with ID:", id);
        const { data } = await getAdministrator(id);
        setAdmin(data);
      } catch (error) {
        console.error("Failed to load administrator:", error);
        setGeneralError("Failed to load administrator");
      } finally {
        setLoading(false);
      }
    }
    loadAdmin();
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: String(formData.get("email")),
      first_name: String(formData.get("first_name")),
      last_name: String(formData.get("last_name")),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role")),
      is_active: formData.get("is_active") === "on",
    };

    startTransition(async () => {
      try {
        console.log("Updating administrator with ID:", id, "Payload:", payload);
        await updateAdministrator(id, payload);
        setSuccess("Administrator updated successfully!");
        setTimeout(() => router.push("/admin/manage"), 1500);
      } catch (error) {
        console.error("Update administrator error:", error);
        const err = error as Error & {
          status?: number;
          errors?: Record<string, string[]>;
        };
        if (err.status === 422 && err.errors) {
          setErrors(err.errors);
        } else if (err.status === 403) {
          setGeneralError("You don't have permission to perform this action");
        } else {
          setGeneralError(err.message || "Failed to update administrator");
        }
      }
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="mt-4 h-64 rounded-lg border border-gray-200 bg-white p-6" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Administrator not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Administrator</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update administrator account details.
        </p>
      </div>

      {generalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {generalError}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-gray-200 bg-white p-6"
      >
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={admin.email}
            required
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              errors.email
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
          )}
        </div>

        {/* Name */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              defaultValue={admin.first_name ?? ""}
              required
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.first_name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.first_name[0]}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              defaultValue={admin.last_name ?? ""}
              required
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.last_name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name[0]}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={admin.phone ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone[0]}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            defaultValue={admin.role ?? ""}
            required
            className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              errors.role
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          >
            <option value="">Select a role</option>
            <option value="super_admin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role[0]}</p>
          )}
        </div>

        {/* Active */}
        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={admin.is_active ?? true}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        {/* Last Login */}
        {admin.last_login_at && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last Login:</span>{" "}
              {new Date(admin.last_login_at).toLocaleString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/manage")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
