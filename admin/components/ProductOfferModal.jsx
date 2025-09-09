import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input } from "../components";
import { useSelector, useDispatch } from "react-redux";
import { updateProductDiscount } from "../../src/store/productsSlice";

/**
 * ProductOfferModal
 * - open, onClose: modal control
 * - initialProduct: optional product object to edit (pre-fill)
 *
 * Behavior:
 * - When adding: shows list of products that currently have discount === 0
 * - When editing: pre-fills selected product and discount; product selection is disabled
 * - Live discounted-price preview shown when a product is selected and discount is valid
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
        // put initial product first (so user sees it), then rest
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
    // try store first
    const found = products.find((p) => p.$id === selected);
    if (found) return found;
    // fallback to initialProduct if it matches
    if (initialProduct && initialProduct.$id === selected) return initialProduct;
    return null;
  }, [selected, products, initialProduct]);

  // Live discounted price preview
  const discountedPrice = useMemo(() => {
    if (!selectedProduct || discount === "") return null;
    const base = Number(selectedProduct.price_cents) / 100;
    const pct = Number(discount);
    if (Number.isNaN(base) || Number.isNaN(pct) || pct < 0 || pct > 100) return null;
    return (base * (1 - pct / 100)).toFixed(2);
  }, [selectedProduct, discount]);

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
      ).unwrap?.(); // unwrap if using RTK async thunks (optional)
      // Close & reset (parent should refresh list if needed)
      setSelected("");
      setDiscount("");
      onClose();
    } catch (err) {
      // User-friendly message
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
            {productOptions.map((p) => (
              <option key={p.$id} value={p.$id}>
                {p.name} — ₹{(p.price_cents / 100).toFixed(2)} ({formatCategory(p)})
              </option>
            ))}
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

        {/* Live Preview */}
        {selectedProduct && discount !== "" && discountedPrice && (
          <div className="p-4 border rounded bg-gray-50">
            <p className="text-sm text-gray-600">
              Original Price:{" "}
              <span className="line-through">
                ₹{(selectedProduct.price_cents / 100).toFixed(2)}
              </span>
            </p>
            <p className="text-lg font-bold text-green-700">
              Discounted Price: ₹{discountedPrice}
            </p>
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
