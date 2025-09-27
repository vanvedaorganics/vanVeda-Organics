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
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const authStatus = useSelector((s) => s.auth?.status);

  const quantity =
    typeof propQty === "number"
      ? propQty
      : Number(items?.[cartKey] ?? items?.[product.slug] ?? 0);

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
    <div className="flex gap-4 border-2 border-[#2D1D1A] rounded-md p-4 shadow-md bg-white hover:shadow-lg transition-all duration-200">
      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 overflow-hidden border-r-2 border-[#2D1D1A] pr-2">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover rounded-sm shadow-sm"
          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
        />
      </div>

      {/* Details + Quantity */}
      <div className="flex-1 flex justify-between items-center">
        {/* Left side: title + price */}
        <div className="flex flex-col justify-between gap-2">
          <div className="flex justify-between items-start gap-2">
            <Link
              to={`/product/${product.slug}`}
              className="syne-bold text-base text-[#201413] hover:underline"
              title={`View ${product.name}`}
            >
              {product.name}
            </Link>
          </div>

          {/* Size pill (when available) */}
          {sizeLabel !== null && (
            <span className="px-2 py-0.5 w-fit text-[11px] rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {sizeLabel || `Size ${typeof sizeIdx === "number" ? sizeIdx + 1 : ""}`}
            </span>
          )}

          <div>
            <div className="roboto-bold text-lg text-[#2D1D1A]">
              ₹{displayUnit.toFixed(2)}
              {hasDiscount && displayBase !== null && (
                <span className="ml-2 text-sm text-[#613D38] line-through">
                  ₹{displayBase.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-xs flex items-center justify-between gap-2 text-gray-600">
              Total: ₹{lineTotal.toFixed(2)}
              <button
                onClick={handleRemove}
                className="ubuntu-medium text-sm text-[#2D1D1A] hover:text-[#2D1D1A]/80 cursor-pointer p-1"
                aria-label={`Remove ${product.name} from cart`}
                title="Remove"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Quantity controls */}
        <div className="flex ml-4 shadow-sm rounded-md overflow-hidden border border-gray-400 h-10">
          {/* Minus */}
          <button
            onClick={() => updateQty(quantity - 1)}
            disabled={quantity <= 0}
            className="bg-[#E7CE9D] w-10 h-full flex items-center justify-center disabled:opacity-50 cursor-pointer"
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Input */}
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              updateQty(Number.isNaN(v) ? 0 : v);
            }}
            className="w-16 text-center text-sm border-0 focus:ring-0 focus:outline-none h-full"
            min="0"
            aria-label={`Quantity for ${product.name}`}
          />

          {/* Plus */}
          <button
            onClick={() => updateQty(quantity + 1)}
            className="bg-[#e7ce9d] w-10 h-full flex items-center justify-center cursor-pointer"
            aria-label={`Increase quantity of ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartCard;