"use client";

import { useState, useTransition, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLogin } from "@/lib/apis/auth";
import { setAdminTokenCookie } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const response = await adminLogin(values.email, values.password);

        // Store the token in a cookie
        if (response.data?.token) {
          setAdminTokenCookie(response.data.token);
        }

        router.replace(nextPath);
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          const data = error.response.data as ValidationError;

          // Handle Laravel validation errors
          if (data.errors) {
            // Set field-specific errors
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

          // Set general error message
          setServerError(data.message || "Login failed. Please try again.");
        } else {
          setServerError("An unexpected error occurred. Please try again.");
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">Admin Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="admin@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Your password"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
