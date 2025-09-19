// components/CartCard.jsx
import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, X } from "lucide-react";
import { Button, Input } from "../components";
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

  // Prefer prop qty (passed from Header). Fallback to store.
  const quantity = typeof propQty === "number" ? propQty : Number(items[product.slug] || 0);

  // Compute price and line total
  const unitPrice =
    product?.discount > 0
      ? product.price_cents / 100 - (product.price_cents / 100) * (product.discount / 100)
      : product.price_cents / 100;
  const lineTotal = Number((unitPrice * (quantity || 0)).toFixed(2));

  // Ensure user is logged in before mutating cart
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
      // normalize to integer >= 0
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
    <div className="flex gap-4 border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={getImageUrl(product.image_file_ids)}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => (e.target.src = "/placeholder.svg")}
        />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <Link
            to={`/product/${product.slug}`}
            className="text-sm font-semibold text-gray-800 hover:underline"
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

        <div className="flex justify-between items-center mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQty(quantity - 1)}
              disabled={quantity <= 0}
              className="hover:bg-gray-100"
              aria-label={`Decrease quantity of ${product.name}`}
              title="Decrease"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                updateQty(Number.isNaN(v) ? 0 : v);
              }}
              className="w-16 text-center text-sm border focus:border-[#201413] focus:ring-[#201413]"
              min="0"
              aria-label={`Quantity for ${product.name}`}
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQty(quantity + 1)}
              className="hover:bg-gray-100"
              aria-label={`Increase quantity of ${product.name}`}
              title="Increase"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Price + Line Total */}
          <div className="text-sm text-right">
            <div className="font-medium text-gray-800">₹{unitPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Total: ₹{lineTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartCard;
