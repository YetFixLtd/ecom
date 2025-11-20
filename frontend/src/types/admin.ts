export interface Administrator {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface AdminLoginResponse {
  message?: string;
  data: {
    administrator: Administrator;
    token: string;
  };
}

export interface AdministratorListResponse {
  data: Administrator[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Order and Fulfillment types (also exported from orders.ts API file)
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "canceled"
  | "refunded";
export type FulfillmentStatus =
  | "pending"
  | "packed"
  | "shipped"
  | "delivered"
  | "canceled"
  | "returned";
