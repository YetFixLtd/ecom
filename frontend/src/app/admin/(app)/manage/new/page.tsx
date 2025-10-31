"use client";

import { createAdministrator } from "@/lib/admin-api";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function NewAdministratorPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      password_confirmation: String(formData.get("password_confirmation")),
      first_name: String(formData.get("first_name")),
      last_name: String(formData.get("last_name")),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role")),
      is_active: formData.get("is_active") === "on",
    };

    startTransition(async () => {
      try {
        console.log("Creating administrator with payload:", payload);
        await createAdministrator(payload);
        setSuccess("Administrator created successfully!");
        setTimeout(() => router.push("/admin/manage"), 1500);
      } catch (error) {
        console.error("Create administrator error:", error);
        const err = error as Error & {
          status?: number;
          errors?: Record<string, string[]>;
        };
        if (err.status === 422 && err.errors) {
          setErrors(err.errors);
        } else {
          setGeneralError(err.message || "Failed to create administrator");
        }
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Administrator</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new administrator account.
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

        {/* Password */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              required
              minLength={8}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.password_confirmation
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password_confirmation[0]}
              </p>
            )}
          </div>
        </div>

        {/* Active */}
        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Administrator"}
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
