import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronDown } from "lucide-react";
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

// NEW: Parse batches helper
const parseBatches = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((b) => ({
        name: String(b?.name ?? "").trim(),
        delivery_date: String(b?.delivery_date ?? "").trim(),
      }))
      .filter((b) => b.name || b.delivery_date);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .map((b) => ({
          name: String(b?.name ?? "").trim(),
          delivery_date: String(b?.delivery_date ?? "").trim(),
        }))
        .filter((b) => b.name || b.delivery_date);
    } catch {
      return [];
    }
  }
  return [];
};

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
  batch, // NEW

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
  const cartItem = items?.[cartKey] || items?.[slug];
  const quantity = typeof cartItem === "number" ? cartItem : (cartItem?.qty ?? 0);
  const cartBatch = typeof cartItem === "object" ? cartItem?.batch : null;
  const inCart = quantity > 0;

  // NEW: Batch state with dropdown control
  const batches = useMemo(() => parseBatches(batch), [batch]);
  const hasBatches = batches.length > 0;
  const [selectedBatchIdx, setSelectedBatchIdx] = useState(0);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchWarning, setBatchWarning] = useState("");

  // Close batch dropdown on outside click
  React.useEffect(() => {
    if (!batchDropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest?.("[data-batch-dropdown]")) {
        setBatchDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [batchDropdownOpen]);

  const selectedBatch = hasBatches ? batches[selectedBatchIdx] : null;

  // Check if product already exists in cart with different batch (across all sizes)
  const getProductBatchInCart = () => {
    const allKeys = Object.keys(items);
    for (const key of allKeys) {
      if (key.startsWith(`${slug}${CART_KEY_SEP}`) || key === slug) {
        const item = items[key];
        const itemBatch = typeof item === "object" ? item?.batch : null;
        if (itemBatch) return itemBatch;
      }
    }
    return null;
  };

  const handleToggleCart = (e) => {
    stopNav(e);
    setBatchWarning("");

    // Require batch selection if product has batches
    if (hasBatches && !selectedBatch) {
      setBatchWarning("Please select a batch before adding to cart");
      return;
    }

    if (inCart) {
      dispatch(removeItemCompletely(cartKey));
    } else {
      // Check if product already in cart with different batch
      const existingBatch = getProductBatchInCart();
      if (existingBatch && selectedBatch) {
        const isSameBatch =
          existingBatch.name === selectedBatch.name &&
          existingBatch.delivery_date === selectedBatch.delivery_date;
        
        if (!isSameBatch) {
          setBatchWarning(
            `This product is already in cart with batch "${existingBatch.name}". Please remove it first or select the same batch.`
          );
          return;
        }
      }

      dispatch(addItemOne(cartKey, selectedBatch));
    }
  };

  const adjustQty = (e, delta) => {
    stopNav(e);
    const newQty = Math.max(0, quantity + delta);
    dispatch(changeItemQuantity({ slug: cartKey, qty: newQty, batch: cartBatch || selectedBatch }));
  };

  return (
    <Link
      to={`/products/${slug}`}
      className={cn(
        "group relative max-w-sm mx-auto overflow-hidden rounded-xl border border-[#E7CE9D]/40 bg-white text-[#2D1D1A] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col",
        // NEW: ensure dropdown can overflow parent when open
        batchDropdownOpen && "overflow-visible",
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

        {/* NEW: Batch dropdown selector */}
        {hasBatches && (
          <div className="mt-3 relative z-10" data-batch-dropdown>
            <div className="text-[10px] font-semibold text-[#2D1D1A] mb-1.5 uppercase tracking-wide">
              Select Batch {inCart && cartBatch && (
                <span className="text-emerald-600 normal-case">
                  (Selected: {cartBatch.name})
                </span>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  stopNav(e);
                  if (!inCart) {
                    setBatchDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={inCart}
                className={cn(
                  "w-full px-2 py-1.5 rounded-md border text-left transition text-xs flex items-center justify-between gap-1",
                  inCart
                    ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    : batchDropdownOpen
                    ? "bg-[#E7CE9D] border-[#2D1D1A] text-[#2D1D1A]"
                    : "bg-white border-[#E7CE9D]/60 text-[#613D38] hover:border-[#E7CE9D] hover:bg-[#E7CE9D]/10"
                )}
              >
                <span className="font-semibold truncate">
                  {inCart && cartBatch
                    ? cartBatch.name || "Unnamed"
                    : selectedBatch?.name || "Select a batch"}
                </span>
                {!inCart && (
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 transition-transform ${
                      batchDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {batchDropdownOpen && !inCart && (
                <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-[#E7CE9D] rounded-md shadow-xl max-h-40 overflow-y-auto overflow-x-hidden">
                  {batches.map((b, idx) => (
                    <button
                      key={`batch-${idx}`}
                      type="button"
                      onClick={(e) => {
                        stopNav(e);
                        setSelectedBatchIdx(idx);
                        setBatchDropdownOpen(false);
                        setBatchWarning("");
                      }}
                      className={cn(
                        "w-full px-2 py-1.5 text-left text-xs hover:bg-[#E7CE9D]/20 transition",
                        idx === selectedBatchIdx ? "bg-[#E7CE9D]/30" : ""
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{b.name || "Unnamed"}</span>
                        {b.delivery_date && (
                          <span className="text-[9px] opacity-75">
                            Delivery: {b.delivery_date}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {batchWarning && (
              <div className="mt-1 text-[10px] text-red-600 font-medium">
                {batchWarning}
              </div>
            )}
          </div>
        )}

        {/* NEW: Spacer to push cart actions to bottom */}
        <div className="flex-1" />

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