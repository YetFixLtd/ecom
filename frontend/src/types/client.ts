// ========================================
// Client-side TypeScript Types
// ========================================

// ========================================
// User Types
// ========================================

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLoginResponse {
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export interface UserRegisterResponse {
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

// ========================================
// Product Types
// ========================================

export interface ProductImage {
  url: string;
  alt_text: string | null;
  position?: number;
  is_primary?: boolean;
}

export interface ProductVariantInventory {
  warehouse_id: number;
  warehouse_name?: string;
  available: number;
  on_hand: number;
  reserved: number;
}

export interface ProductVariantAttribute {
  attribute_id: number;
  attribute_name: string;
  value_id: number;
  value: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  barcode?: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  status?: string;
  inventory?: ProductVariantInventory[];
  attributes?: ProductVariantAttribute[];
}

export interface ClientProduct {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  brand?: {
    id: number;
    name: string;
    slug: string;
  };
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  primary_image: {
    url: string;
    alt_text: string | null;
  } | null;
  images?: Array<{
    url: string;
    alt_text: string | null;
    position: number;
    is_primary: boolean;
  }>;
  variants?: ProductVariant[];
  min_price: number | null;
  max_price: number | null;
  is_featured: boolean;
  is_upcoming?: boolean;
  call_for_price?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListParams {
  search?: string;
  category?: string | number;
  brand?: string | number;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  upcoming?: boolean;
  sort?: string;
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

export interface ProductListResponse {
  data: ClientProduct[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ProductResponse {
  data: ClientProduct;
}

export interface ProductVariantsResponse {
  data: Array<{
    id: number;
    sku: string;
    barcode?: string;
    price: number;
    compare_at_price: number | null;
    currency: string;
    track_stock: boolean;
    allow_backorder: boolean;
    inventory: ProductVariantInventory[];
    attributes: ProductVariantAttribute[];
  }>;
}

// ========================================
// Category Types
// ========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  path: string;
  parent_id: number | null;
  image_url: string | null;
  image_path: string | null;
  is_featured: boolean;
  status: "active" | "inactive";
  parent?: Category;
  children?: Category[];
  products_count?: number;
}

export interface CategoryListResponse {
  data: Category[];
}

export interface CategoryResponse {
  data: Category;
}

// ========================================
// Brand Types
// ========================================

export interface Brand {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  products_count?: number;
}

export interface BrandListResponse {
  data: Brand[];
}

export interface BrandResponse {
  data: Brand;
}

export interface BrandListParams {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

// ========================================
// Cart Types
// ========================================

export interface CartItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant?: {
    id: number;
    sku: string;
    price: number;
    product?: {
      id: number;
      name: string;
      slug: string;
      primary_image: {
        url: string;
        alt_text: string | null;
      } | null;
    };
  };
}

export interface Cart {
  id: number;
  currency: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  data: Cart;
}

export interface AddToCartRequest {
  variant_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ========================================
// Order Types
// ========================================

export interface OrderItem {
  id: number;
  variant_id: number;
  product_name: string;
  variant_sku: string;
  quantity: number;
  unit_price: number;
  discount_total: number;
  tax_total: number;
  total: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  carrier: string;
  estimated_days: number | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  billing_address?: Address;
  shipping_address?: Address;
  shipping_method?: ShippingMethod;
  items: OrderItem[];
  placed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface OrderResponse {
  data: Order;
}

export interface CreateOrderRequest {
  billing_address_id?: number;
  shipping_address_id?: number;
  billing_address?: CreateAddressRequest;
  shipping_address?: CreateAddressRequest;
  shipping_method_id?: number;
  guest_email?: string;
  guest_name?: string;
}

// ========================================
// Address Types
// ========================================

export interface Address {
  id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state_region: string | null;
  postal_code: string | null;
  country_code: string;
  is_default_billing: boolean;
  is_default_shipping: boolean;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface AddressListResponse {
  data: Address[];
}

export interface AddressResponse {
  data: Address;
}

export interface CreateAddressRequest {
  name: string;
  contact_name?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state_region?: string;
  postal_code?: string;
  country_code: string;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}
