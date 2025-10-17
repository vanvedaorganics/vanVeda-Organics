import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { cn } from "../../utils/lib";
import { useSelector, useDispatch } from "react-redux";
import { getImageUrl } from "../../utils/getImageUrl";
import { Button } from "./index";
import {
  addItemOne,
  removeItemCompletely,
  changeItemQuantity,
  selectCartItems,
} from "../store/cartsSlice";

// Parse packaging_size that may contain stringified objects
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

const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (d <= 0) return cents;
  return Math.round((cents * (100 - d)) / 100);
};

const getMainImageId = (sizeObj) =>
  Array.isArray(sizeObj?.images) && sizeObj.images.length > 0
    ? sizeObj.images[0]
    : "";

const currencyLabel = (currency = "INR") => (currency === "INR" ? "₹" : currency);

const CART_KEY_SEP = "::";
const makeCartKey = (slug, sizeIdx) => `${slug}${CART_KEY_SEP}${sizeIdx}`;

const ProductCard = ({
  // New schema fields
  name,
  slug,
  description,
  packaging_size = [],
  discount = 0,
  currency = "INR",
  categories, // string id/slug or related object
  average_rating ,
  review_count,

  // Styling
  className,
}) => {
  // Sizes parsing
  const sizes = useMemo(() => parsePackagingSizes(packaging_size), [packaging_size]);
  const hasDiscount = Number(discount) > 0;

  // Category resolution via Redux store (Categories collection)
  const categoryItems = useSelector((s) => s.categories?.items || []);
  const categoryKey = useMemo(() => {
    if (!categories) return "";
    if (typeof categories === "string") return categories; // id/slug
    if (typeof categories === "object") return categories.$id || categories.slug || "";
    return "";
  }, [categories]);

  const categoryName = useMemo(() => {
    if (!categoryKey) return "";
    const match = categoryItems.find(
      (c) => c.$id === categoryKey || c.slug === categoryKey
    );
    return match?.name || "";
  }, [categoryKey, categoryItems]);

  // Card state
  const [activeIdx, setActiveIdx] = useState(0);

  const activeSize = sizes[activeIdx] || null;
  const activeMainImageId = activeSize ? getMainImageId(activeSize) : "";
  const imageUrl = activeMainImageId ? getImageUrl(activeMainImageId) : "/placeholder.svg";

  const baseCents =
    typeof activeSize?.price_cents === "number" ? activeSize.price_cents : 0;
  const finalCents = discountPrice(baseCents, discount);

  const c = currencyLabel(currency);
  const formattedFinal = `${c} ${(finalCents / 100).toFixed(2)}`;
  const formattedBase = `${c} ${(baseCents / 100).toFixed(2)}`;

  // Stop navigation when interacting with size controls inside the Link
  const stopNav = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);

  // Build cart key for active size
  const cartKey = makeCartKey(slug, activeIdx);
  const quantity = Number(items?.[cartKey] ?? items?.[slug] ?? 0);
  const inCart = quantity > 0;

  const handleToggleCart = (e) => {
    stopNav(e);
    if (inCart) {
      dispatch(removeItemCompletely(cartKey));
    } else {
      dispatch(addItemOne(cartKey));
    }
  };

  const adjustQty = (e, delta) => {
    stopNav(e);
    const newQty = Math.max(0, quantity + delta);
    dispatch(changeItemQuantity({ slug: cartKey, qty: newQty }));
  };

  return (
    <Link
      to={`/products/${slug}`}
      className={cn(
        "group relative max-w-sm mx-auto overflow-hidden rounded-xl border border-[#E7CE9D]/40 bg-white text-[#2D1D1A] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col",
        className
      )}
      aria-label={`View product ${name}`}
    >
      {/* Image (main image of selected packaging size) */}
      <div className="relative w-full aspect-[5/6] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
          loading="lazy"
        />

        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#E7CE9D]/40 flex flex-col flex-1">
        {/* Title + Category pill combined */}
        <div className="flex items-start gap-2">
          <h3 className="text-base font-semibold line-clamp-1 flex-1">{name}</h3>
          {categoryName && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#E7CE9D] text-[#2D1D1A] text-[10px] font-semibold tracking-wide">
              {categoryName}
            </span>
          )}
        </div>

        {description ? (
          <p className="text-xs text-[#613D38] line-clamp-2 mt-1">{description}</p>
        ) : null}

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(average_rating)
                    ? "fill-[#2D1D1A] text-[#2D1D1A]"
                    : "fill-gray-200 stroke-gray-400"
                }`}
              />
            ))}
          </div>
          <span>({review_count})</span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-[#2D1D1A]">{formattedFinal}</span>
          {hasDiscount && baseCents > 0 && (
            <span className="text-xs line-through text-[#613D38]">{formattedBase}</span>
          )}
        </div>

        {/* Size selector */}
        {sizes.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {sizes.map((s, idx) => {
                const selected = idx === activeIdx;
                return (
                  <button
                    key={`${s.size}-${idx}`}
                    type="button"
                    onClick={(e) => {
                      stopNav(e);
                      setActiveIdx(idx);
                    }}
                    className={cn(
                      "px-2 py-1 rounded border-2 text-xs font-semibold transition tracking-wide",
                      selected
                        ? "bg-[#2D1D1A] text-white border-[#2D1D1A]"
                        : "bg-white text-[#2D1D1A] border-[#2D1D1A] hover:bg-[#2D1D1A]/10"
                    )}
                    aria-pressed={selected}
                    aria-label={`Select size ${s.size || idx + 1}`}
                  >
                    {s.size || `Size ${idx + 1}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cart Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            onClick={handleToggleCart}
            size="sm"
            className={cn(
              "flex-1 text-xs font-semibold shadow-sm transition bg-[#2D1D1A] hover:bg-[#2D1D1A]/90 text-white"
            )}
          >
            {inCart ? "Remove" : "Add To Cart"}
          </Button>

          {inCart && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => adjustQty(e, -1)}
                aria-label="Decrease quantity"
                className="h-8 w-8 flex items-center justify-center rounded bg-[#E7CE9D]/40 hover:bg-[#E7CE9D]/60 text-[#2D1D1A] text-sm font-bold"
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                onClick={(e) => adjustQty(e, 1)}
                aria-label="Increase quantity"
                className="h-8 w-8 flex items-center justify-center rounded bg-[#E7CE9D]/40 hover:bg-[#E7CE9D]/60 text-[#2D1D1A] text-sm font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;