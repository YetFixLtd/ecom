"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { createAdministrator, type CreateAdminData } from "@/lib/apis/adminManage";
import { AxiosError } from "axios";

const schema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  password_confirmation: z.string().min(1, "Please confirm your password."),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "manager", "staff", "worker"]),
  is_active: z.boolean().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAdminModal({ onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "staff",
      is_active: true,
    },
  });

  const getAdminToken = (): string | null => {
    const match = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = getAdminToken();
      if (!token) {
        setServerError("Not authenticated");
        return;
      }

      await createAdministrator(token, values as CreateAdminData);
      onSuccess();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const data = error.response.data as ValidationError;

        // Handle Laravel validation errors
        if (data.errors) {
          Object.keys(data.errors).forEach((field) => {
            const fieldErrors = data.errors?.[field];
            if (fieldErrors && fieldErrors.length > 0) {
              setError(field as keyof FormValues, {
                type: "server",
                message: fieldErrors[0],
              });
            }
          });
        }

        setServerError(data.message || "Failed to create administrator.");
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Create Administrator</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="space-y-4">
            {/* General Error */}
            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("first_name")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Last Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("last_name")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Min. 8 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  {...register("password_confirmation")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Confirm password"
                />
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                {...register("role")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="worker">Worker</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_active")}
                id="is_active"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active (user can log in)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Administrator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

