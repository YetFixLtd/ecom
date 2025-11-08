import axios from "axios";
import {
  setUserTokenCookie,
  deleteUserTokenCookie,
} from "../cookies";
import type {
  UserLoginResponse,
  UserRegisterResponse,
  User,
} from "../../types/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// User/Customer Auth Functions
// ========================================

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterRequest
): Promise<UserRegisterResponse> {
  const response = await api.post("/auth/register", data);
  const result = response.data as UserRegisterResponse;
  
  // Store token in cookie if registration successful
  if (result.data?.token) {
    setUserTokenCookie(result.data.token);
  }
  
  return result;
}

/**
 * Login user
 */
export async function login(
  email: string,
  password: string
): Promise<UserLoginResponse> {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  const result = response.data as UserLoginResponse;
  
  // Store token in cookie if login successful
  if (result.data?.token) {
    setUserTokenCookie(result.data.token);
  }
  
  return result;
}

/**
 * Logout user
 */
export async function logout(token: string) {
  const response = await api.post(
    "/auth/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  // Delete token from cookie
  deleteUserTokenCookie();
  
  return response.data;
}

/**
 * Get authenticated user profile
 */
export async function me(token: string): Promise<{ data: User }> {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  token: string,
  data: UpdateProfileRequest
): Promise<{ message: string; data: User }> {
  const response = await api.put("/auth/profile", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Change user password
 */
export async function changePassword(
  token: string,
  data: ChangePasswordRequest
): Promise<{ message: string }> {
  const response = await api.put("/auth/password", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // Password change revokes all tokens, so delete cookie
  deleteUserTokenCookie();
  
  return response.data;
}

// Admin Auth Functions
export async function adminLogin(email: string, password: string) {
  const response = await api.post("/admin/auth/login", {
    email,
    password,
  });
  return response.data;
}

export async function adminLogout(token: string) {
  const response = await api.post(
    "/admin/auth/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function adminMe(token: string) {
  const response = await api.get("/admin/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
