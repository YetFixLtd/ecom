"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  updateAdministrator,
  type Administrator,
  type UpdateAdminData,
} from "@/lib/apis/adminManage";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z
  .object({
    email: z
      .string()
      .email("Please provide a valid email address.")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .optional()
      .or(z.literal("")),
    password_confirmation: z.string().optional().or(z.literal("")),
    first_name: z
      .string()
      .min(1, "First name is required.")
      .optional()
      .or(z.literal("")),
    last_name: z
      .string()
      .min(1, "Last name is required.")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    role: z
      .enum(["super_admin", "admin", "manager", "staff", "worker"])
      .optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.password_confirmation;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["password_confirmation"],
    }
  );

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  admin: Administrator;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAdminModal({ admin, onClose, onSuccess }: Props) {
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
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      phone: admin.phone || "",
      role: admin.role,
      is_active: admin.is_active,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated");
        return;
      }

      // Only send fields that have values
      const updateData: UpdateAdminData = {};

      if (values.email && values.email !== admin.email) {
        updateData.email = values.email;
      }
      if (values.first_name && values.first_name !== admin.first_name) {
        updateData.first_name = values.first_name;
      }
      if (values.last_name && values.last_name !== admin.last_name) {
        updateData.last_name = values.last_name;
      }
      if (values.phone !== undefined && values.phone !== admin.phone) {
        updateData.phone = values.phone;
      }
      if (values.role && values.role !== admin.role) {
        updateData.role = values.role;
      }
      if (
        values.is_active !== undefined &&
        values.is_active !== admin.is_active
      ) {
        updateData.is_active = values.is_active;
      }
      if (values.password && values.password.length > 0) {
        updateData.password = values.password;
        updateData.password_confirmation = values.password_confirmation;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateAdministrator(token, admin.id, updateData);
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

        setServerError(data.message || "Failed to update administrator.");
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
          <h2 className="text-lg font-semibold">Edit Administrator</h2>
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
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  First Name
                </label>
                <input
                  type="text"
                  {...register("first_name")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Last Name
                </label>
                <input
                  type="text"
                  {...register("last_name")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.last_name.message}
                  </p>
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password Fields (Optional) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-medium">
                Change Password (Optional)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    New Password
                  </label>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Leave blank to keep current"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...register("password_confirmation")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Confirm new password"
                  />
                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_active")}
                id="is_active_edit"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
              />
              <label htmlFor="is_active_edit" className="text-sm font-medium">
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
