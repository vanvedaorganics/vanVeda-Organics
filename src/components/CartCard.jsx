// components/CartCard.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus } from "lucide-react";
import { Input } from "../components";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";

const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (!cents || d <= 0) return cents || 0;
  return Math.round((cents * (100 - d)) / 100);
};

function CartCard({
  product,
  qty: propQty,
  cartKey, // composite key: `${slug}::${sizeIdx}` (legacy: `${slug}`)
  sizeIdx = null,
  sizeLabel = null,
  unitCents, // precomputed in Header for accuracy
  imageFileId = null,
  batch = null, // NEW: batch data
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const authStatus = useSelector((s) => s.auth?.status);

  const cartItem = items?.[cartKey] || items?.[product.slug];
  const quantity =
    typeof propQty === "number"
      ? propQty
      : typeof cartItem === "number"
      ? cartItem
      : (cartItem?.qty ?? 0);

  // Prices
  const baseCents =
    typeof unitCents === "number" && unitCents > 0
      ? (product.discount > 0
          ? Math.round((unitCents * 100) / (100 - Number(product.discount)))
          : unitCents)
      : typeof product.price_cents === "number"
      ? discountPrice(product.price_cents, 0)
      : 0;

  const hasDiscount = Number(product?.discount) > 0;
  const displayUnit = unitCents / 100;
  const displayBase = hasDiscount ? baseCents / 100 : null;
  const lineTotal = Number((displayUnit * (quantity || 0)).toFixed(2));

  const ensureLoggedInThen = useCallback(
    (cb) => {
      if (!authStatus) {
        navigate(`/login?returnTo=/product/${product.slug}`);
        return;
      }
      cb();
    },
    [authStatus, navigate, product.slug]
  );

  const updateQty = useCallback(
    (newQty) => {
      const normalized = Math.max(0, Math.floor(Number(newQty) || 0));
      ensureLoggedInThen(() => {
        // Use composite cartKey so each packaging size is independent in the cart
        dispatch(changeItemQuantity({ slug: cartKey || product.slug, qty: normalized }));
      });
    },
    [dispatch, ensureLoggedInThen, cartKey, product.slug]
  );

  const handleRemove = useCallback(() => {
    ensureLoggedInThen(() => {
      dispatch(removeItemCompletely(cartKey || product.slug));
    });
  }, [dispatch, ensureLoggedInThen, cartKey, product.slug]);

  const imageUrl = imageFileId ? getImageUrl(imageFileId) : "/placeholder.svg";

  return (
    <div className="group flex flex-col sm:flex-row gap-5 bg-white border border-[#E7CE9D]/30 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300">
      {/* ── Image ────────────────────────────────────────── */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-2xl bg-[#faf8f4] border border-[#E7CE9D]/20">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
      </div>

      {/* ── Details ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Link
              to={`/product/${product.slug}`}
              className="syne-bold text-lg text-[#1a2e1a] hover:text-[#28543d] transition-colors leading-tight"
            >
              {product.name}
            </Link>
            
            <button
              onClick={handleRemove}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
              aria-label={`Remove ${product.name} from cart`}
            >
              Remove
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Size pill */}
            {sizeLabel !== null && (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-[#28543d]/5 text-[#28543d] border border-[#28543d]/10 uppercase tracking-wider">
                {sizeLabel || `Size ${typeof sizeIdx === "number" ? sizeIdx + 1 : ""}`}
              </span>
            )}

            {/* Batch pill */}
            {batch && (batch.name || batch.delivery_date) && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-[#E7CE9D]/30 text-[#744531] border border-[#744531]/10 uppercase tracking-wider">
                  Batch: {batch.name || "Unnamed"}
                </span>
              </div>
            )}
          </div>
          
          {batch?.delivery_date && (
            <p className="text-[10px] text-gray-400 font-medium italic">
              Estimated arrival: {batch.delivery_date}
            </p>
          )}
        </div>

        {/* ── Bottom Section: Price & Quantity ─────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#744531]">₹{displayUnit.toFixed(2)}</span>
              {hasDiscount && displayBase !== null && (
                <span className="text-xs text-gray-400 line-through">₹{displayBase.toFixed(2)}</span>
              )}
            </div>
            <div className="text-[11px] font-bold text-[#28543d] uppercase tracking-widest">
              Total: ₹{lineTotal.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center bg-[#f5f0e8] rounded-xl p-1 shadow-inner border border-black/[0.03]">
            <button
              onClick={() => updateQty(quantity - 1)}
              disabled={quantity <= 0}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-[#744531] transition-all disabled:opacity-30"
              aria-label={`Decrease quantity of ${product.name}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateQty(Number.isNaN(v) ? 0 : v);
              }}
              className="w-10 bg-transparent text-center font-bold text-sm text-[#744531] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="0"
            />
            <button
              onClick={() => updateQty(quantity + 1)}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-[#744531] transition-all"
              aria-label={`Increase quantity of ${product.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartCard;