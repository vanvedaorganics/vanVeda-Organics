import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input } from "../components";
import { useSelector, useDispatch } from "react-redux";
import { updateProductDiscount } from "../../src/store/productsSlice";

// Helpers to work with new schema
const parsePackagingSizes = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      try {
        const obj = typeof item === "string" ? JSON.parse(item) : item || {};
        return {
          size: obj?.size || "",
          price_cents: obj?.price_cents ? Number(obj.price_cents) : undefined,
          images: Array.isArray(obj?.images) ? obj.images.filter(Boolean) : [],
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const formatINR = (cents) => `₹${(cents / 100).toFixed(2)}`;
const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (d <= 0) return cents;
  return Math.round((cents * (100 - d)) / 100);
};
const getMinPriceCents = (raw) => {
  const p = parsePackagingSizes(raw);
  const cents = p
    .map((x) => (typeof x.price_cents === "number" ? x.price_cents : NaN))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (!cents.length) return null;
  return Math.min(...cents);
};

/**
 * ProductOfferModal
 * - open, onClose: modal control
 * - initialProduct: optional product object to edit (pre-fill)
 *
 * Now uses packaging_size prices:
 * - Dropdown shows "from" price (min of per-size prices)
 * - Preview shows per-size pricing with discount applied
 */
export default function ProductOfferModal({ open, onClose, initialProduct = null }) {
  const dispatch = useDispatch();
  const products = useSelector((s) => s.products.items || []);

  const [selected, setSelected] = useState(initialProduct?.$id ?? "");
  const [discount, setDiscount] = useState(
    initialProduct ? String(initialProduct.discount ?? "") : ""
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Build the list of selectable products:
  // - For "add" mode: only products with discount === 0
  // - For "edit" mode: include the initialProduct if it's not in the discountable list
  const productOptions = useMemo(() => {
    const base = products.filter((p) => Number(p.discount) === 0);
    if (initialProduct) {
      const exists = base.some((p) => p.$id === initialProduct.$id);
      if (!exists) {
        return [initialProduct, ...base];
      }
    }
    return base;
  }, [products, initialProduct]);

  // Keep local state synced when modal opens or initialProduct changes
  useEffect(() => {
    if (open) {
      setSelected(initialProduct?.$id ?? "");
      setDiscount(initialProduct ? String(initialProduct.discount ?? "") : "");
      setError("");
    }
  }, [open, initialProduct]);

  // Derive the selected product object (may be from store or initialProduct)
  const selectedProduct = useMemo(() => {
    if (!selected) return null;
    const found = products.find((p) => p.$id === selected);
    if (found) return found;
    if (initialProduct && initialProduct.$id === selected) return initialProduct;
    return null;
  }, [selected, products, initialProduct]);

  // Parsed packaging sizes for selected product
  const selectedPackaging = useMemo(() => {
    if (!selectedProduct) return [];
    return parsePackagingSizes(selectedProduct.packaging_size);
  }, [selectedProduct]);

  // Live discounted price preview rows (per size)
  const previewRows = useMemo(() => {
    if (!selectedPackaging.length) return [];
    const pct = discount === "" ? null : Number(discount);
    return selectedPackaging.map((p) => {
      const cents = typeof p.price_cents === "number" ? p.price_cents : null;
      if (!cents || cents <= 0) {
        return { size: p.size || "—", original: null, discounted: null };
      }
      const discounted = pct === null || Number.isNaN(pct) ? null : discountPrice(cents, pct);
      return { size: p.size || "—", original: cents, discounted };
    });
  }, [selectedPackaging, discount]);

  const validateInputs = () => {
    if (!selected) {
      setError("Please select a product.");
      return false;
    }
    if (discount === "") {
      setError("Please enter a discount percentage.");
      return false;
    }
    const pct = Number(discount);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError("Discount must be a number between 0 and 100.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateInputs()) return;

    setSubmitting(true);
    try {
      await dispatch(
        updateProductDiscount({ productId: selected, discount: Number(discount) })
      ).unwrap?.();
      setSelected("");
      setDiscount("");
      onClose();
    } catch (err) {
      setError(
        (err && err.message) ||
          "Failed to apply discount. Please try again or check your network."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatCategory = (p) => {
    if (!p?.categories) return "—";
    if (typeof p.categories === "string") {
      return p.categories.charAt(0).toUpperCase() + p.categories.slice(1);
    }
    return p.categories?.name ?? "—";
  };

  return (
    <Modal
      open={open}
      onOpenChange={() => {
        onClose();
      }}
      title={initialProduct ? "Edit Offer" : "Add Offer"}
    >
      <div className="space-y-6">
        {/* Product Select */}
        <div>
          <label className="block font-medium mb-2">Select Product</label>
          <select
            className="w-full border rounded p-2"
            value={selected || ""}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!!initialProduct || submitting}
          >
            <option value="">-- Select --</option>
            {productOptions.map((p) => {
              const minCents = getMinPriceCents(p.packaging_size);
              const priceLabel = minCents ? ` — from ${formatINR(minCents)}` : "";
              return (
                <option key={p.$id} value={p.$id}>
                  {p.name}
                  {priceLabel} ({formatCategory(p)})
                </option>
              );
            })}
          </select>
        </div>

        {/* Discount Input */}
        <div>
          <label className="block font-medium mb-2">Discount %</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0–100"
            disabled={submitting}
          />
        </div>

        {/* Live Preview (per size) */}
        {selectedProduct && previewRows.length > 0 && discount !== "" && (
          <div className="p-4 border rounded bg-gray-50 space-y-2">
            <p className="text-sm text-gray-700 font-medium">Price preview per size</p>
            <div className="space-y-1">
              {previewRows.map((row, idx) => {
                if (!row.original) {
                  return (
                    <div key={idx} className="text-sm text-gray-500">
                      {row.size}: —
                    </div>
                  );
                }
                // If discount number valid, show strikethrough + discounted, else just original
                const pct = Number(discount);
                const showDiscount = !Number.isNaN(pct) && pct > 0;
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="min-w-[64px] text-gray-600">{row.size}:</span>
                    {!showDiscount ? (
                      <span className="text-gray-800">{formatINR(row.original)}</span>
                    ) : (
                      <>
                        <span className="text-gray-400 line-through">
                          {formatINR(row.original)}
                        </span>
                        <span className="text-green-700 font-semibold">
                          {formatINR(row.discounted)}
                        </span>
                        <span className="text-[10px] text-green-700">-{pct}%</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <Button
          className="w-full bg-[#dfb96a]"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : initialProduct ? "Update Offer" : "Apply Discount"}
        </Button>
      </div>
    </Modal>
  );
}