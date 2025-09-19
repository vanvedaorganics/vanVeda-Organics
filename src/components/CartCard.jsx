// components/CartCard.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, X } from "lucide-react";
import { Input } from "../components";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";

function CartCard({ product, qty: propQty }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const authStatus = useSelector((s) => s.auth?.status);

  const quantity =
    typeof propQty === "number" ? propQty : Number(items[product.slug] || 0);

  const basePrice = product.price_cents / 100;
  const hasDiscount = product?.discount > 0;
  const unitPrice = hasDiscount
    ? basePrice - basePrice * (product.discount / 100)
    : basePrice;
  const lineTotal = Number((unitPrice * (quantity || 0)).toFixed(2));

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
        dispatch(changeItemQuantity({ slug: product.slug, qty: normalized }));
      });
    },
    [dispatch, ensureLoggedInThen, product.slug]
  );

  const handleRemove = useCallback(() => {
    ensureLoggedInThen(() => {
      dispatch(removeItemCompletely(product.slug));
    });
  }, [dispatch, ensureLoggedInThen, product.slug]);

  return (
    <div className="flex gap-4 border-2 border-[#2D1D1A] rounded-md p-4 shadow-md bg-white hover:shadow-lg transition-all duration-200">
      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 overflow-hidden border-r-2 border-[#2D1D1A] pr-2">
        <img
          src={getImageUrl(product.image_file_ids)}
          alt={product.name}
          className="w-full h-full object-cover rounded-sm shadow-sm"
          onError={(e) => (e.target.src = "/placeholder.svg")}
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
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-600 p-1"
              aria-label={`Remove ${product.name} from cart`}
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <div className="roboto-bold text-lg text-[#2D1D1A]">
              ₹{unitPrice.toFixed(2)}
              {hasDiscount && (
                <span className="ml-2 text-sm text-[#613D38] line-through">
                  ₹{basePrice.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              Total: ₹{lineTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Right side: Quantity controls */}
        <div className="flex ml-4 shadow-sm rounded-md overflow-hidden border border-[#2D1D1A] h-10">
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
