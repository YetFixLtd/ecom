"use client";

import { useState, useEffect } from "react";
import { getPublicSettings } from "@/lib/apis/settings";

export function useCallForPricePhone() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPhoneNumber() {
      try {
        const response = await getPublicSettings();
        setPhoneNumber(response.data.call_for_price_phone || null);
      } catch (error) {
        console.error("Error loading call for price phone:", error);
        setPhoneNumber(null);
      } finally {
        setLoading(false);
      }
    }
    loadPhoneNumber();
  }, []);

  return { phoneNumber, loading };
}
