export interface GuestCartItem {
  id: string; // Temporary ID for guest cart
  variant_id: number;
  quantity: number;
  unit_price: number;
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

export interface GuestCart {
  items: GuestCartItem[];
  currency: string;
}

const GUEST_CART_KEY = "guest_cart";

/**
 * Get guest cart from localStorage
 */
export function getGuestCart(): GuestCart {
  if (typeof window === "undefined") {
    return { items: [], currency: "BDT" };
  }

  try {
    const cartStr = localStorage.getItem(GUEST_CART_KEY);
    if (cartStr) {
      return JSON.parse(cartStr);
    }
  } catch (error) {
    console.error("Error reading guest cart:", error);
  }

  return { items: [], currency: "BDT" };
}

/**
 * Save guest cart to localStorage
 */
export function saveGuestCart(cart: GuestCart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
}

/**
 * Add item to guest cart
 * Note: This function does NOT validate inventory.
 * Inventory validation should be done before calling this function.
 */
export function addToGuestCart(
  variantId: number,
  quantity: number,
  unitPrice: number,
  variant?: GuestCartItem["variant"]
): void {
  const cart = getGuestCart();
  const existingItemIndex = cart.items.findIndex(
    (item) => item.variant_id === variantId
  );

  if (existingItemIndex >= 0) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    const newItem: GuestCartItem = {
      id: `guest_${Date.now()}_${Math.random()}`,
      variant_id: variantId,
      quantity,
      unit_price: unitPrice,
      variant,
    };
    cart.items.push(newItem);
  }

  saveGuestCart(cart);

  // Dispatch event to notify other components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("guestCartUpdated"));
  }
}

/**
 * Update guest cart item quantity
 */
export function updateGuestCartItem(itemId: string, quantity: number): void {
  const cart = getGuestCart();
  const itemIndex = cart.items.findIndex((item) => item.id === itemId);

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    saveGuestCart(cart);

    // Dispatch event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("guestCartUpdated"));
    }
  }
}

/**
 * Remove item from guest cart
 */
export function removeGuestCartItem(itemId: string): void {
  const cart = getGuestCart();
  cart.items = cart.items.filter((item) => item.id !== itemId);
  saveGuestCart(cart);

  // Dispatch event to notify other components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("guestCartUpdated"));
  }
}

/**
 * Clear guest cart
 */
export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);

  // Dispatch event to notify other components
  window.dispatchEvent(new Event("guestCartUpdated"));
}

/**
 * Get guest cart item count
 */
export function getGuestCartCount(): number {
  const cart = getGuestCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get guest cart total
 */
export function getGuestCartTotal(): number {
  const cart = getGuestCart();
  return cart.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
}

/**
 * Convert guest cart to Cart format for checkout
 */
export function getGuestCartForCheckout() {
  const cart = getGuestCart();
  return {
    id: 0,
    currency: cart.currency || "BDT",
    status: "open",
    items: cart.items.map((item, index) => ({
      id: index + 1, // Use index as temporary ID
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.unit_price * item.quantity,
      variant: item.variant,
      // Store guest item ID for removal
      guestItemId: item.id,
    })),
    subtotal: getGuestCartTotal(),
    items_count: getGuestCartCount(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
