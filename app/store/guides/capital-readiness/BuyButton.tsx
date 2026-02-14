"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface BuyButtonProps {
  productId: string;
  price: string;
  variant?: "primary" | "white";
}

export function BuyButton({ productId, price, variant = "primary" }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/store/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const baseClasses = "inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = variant === "white"
    ? "bg-white text-brand-blue-600 hover:bg-brand-blue-50"
    : "bg-brand-blue-600 text-white hover:bg-brand-blue-700";

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Buy Now — {price}
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
