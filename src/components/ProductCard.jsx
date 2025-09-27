import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { cn } from "../../utils/lib";
import { useSelector } from "react-redux";
import { getImageUrl } from "../../utils/getImageUrl";

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

const ProductCard = ({
  // New schema fields
  name,
  slug,
  description,
  packaging_size = [],
  discount = 0,
  currency = "INR",
  categories, // string id/slug or related object

  // Optional extras (not from schema, safe defaults)
  rating = 0,
  reviews = 0,

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

  return (
    <Link
      to={`/products/${slug}`}
      className={cn(
        "group relative max-w-sm mx-auto overflow-hidden rounded-xl border border-gray-100 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer",
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

      {/* Content */}
      <div className="p-3 border-t border-t-gray-100">
        <h3 className="text-base font-semibold line-clamp-1">{name}</h3>

        {categoryName ? (
          <span className="mt-1 inline-block px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {categoryName}
          </span>
        ) : null}

        {description ? (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{description}</p>
        ) : null}

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(rating)
                    ? "fill-green-900 text-green-900"
                    : "fill-gray-200 stroke-gray-400"
                }`}
              />
            ))}
          </div>
          <span>({reviews})</span>
        </div>

        {/* Price (updates per selected packaging size) */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{formattedFinal}</span>
          {hasDiscount && baseCents > 0 && (
            <span className="text-xs line-through text-gray-500">{formattedBase}</span>
          )}
        </div>

        {/* Packaging size selector (updates image + price). Displays only main image per size */}
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
                      "px-2 py-1 rounded border text-xs transition",
                      selected
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    )}
                    aria-pressed={selected}
                    aria-label={`Select size ${s.size || idx + 1}`}
                  >
                    {s.size || `Size ${idx + 1}`}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Image updates to the main photo of the selected size.
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;