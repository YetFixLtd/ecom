import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// User/Customer Auth Functions
export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  return response.data;
}

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
  return response.data;
}

export async function me(token: string) {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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
