import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";

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
  stock, // NEW — null means not tracked; 0 means out of stock

  // Styling
  className,
}) => {
  // Sizes parsing
  const sizes = useMemo(() => parsePackagingSizes(packaging_size), [packaging_size]);
  const hasDiscount = Number(discount) > 0;

  // Stock awareness
  const isOutOfStock = typeof stock === "number" && stock === 0;
  const isLowStock = typeof stock === "number" && stock > 0 && stock <= 10;
  const isStockTracked = typeof stock === "number";

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
  const navigate = useNavigate();
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

  const handleBuyNow = (e) => {
    stopNav(e);
    setBatchWarning("");

    // Require batch selection if product has batches
    if (hasBatches && !selectedBatch) {
      setBatchWarning("Please select a batch before buying now");
      return;
    }

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

    if (!inCart) {
      dispatch(addItemOne(cartKey, selectedBatch));
    }
    navigate("/checkout");
  };

  const adjustQty = (e, delta) => {
    stopNav(e);
    const newQty = Math.max(0, quantity + delta);
    dispatch(changeItemQuantity({ slug: cartKey, qty: newQty, batch: cartBatch || selectedBatch }));
  };
  return (
    <motion.div
      layout
      className={cn(
        "group relative max-w-sm mx-auto overflow-hidden rounded-[2rem] bg-white text-[#744531] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(40,84,61,0.1)] transition-all duration-500 hover:-translate-y-2 flex flex-col border border-[#E7CE9D]/20",
        batchDropdownOpen && "overflow-visible",
        className
      )}
    >
      <Link
        to={`/products/${slug}`}
        className="flex flex-col h-full"
        aria-label={`View product ${name}`}
      >
      {/* ── Image ────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#faf8f4]">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient scrim at bottom for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Out of stock ribbon */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="bg-red-600 text-white font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#744531]/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg tracking-wider border border-white/20">
            {discount}% OFF
          </div>
        )}

        {/* Low stock badge */}
        {isLowStock && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-amber-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg tracking-wider border border-white/20">
            Only {stock} left!
          </div>
        )}
        
        {/* Category pill — top right */}
        {categoryName && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-[#28543d] text-[10px] font-bold tracking-wider shadow-sm border border-white/40 uppercase">
            {categoryName}
          </span>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1 gap-2">

        {/* Name */}
        <h3 className="text-[15px] font-bold leading-snug line-clamp-1 text-[#1a2e1a]">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-[#6b5c55] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-[#744531] tracking-tight">{formattedFinal}</span>
          {hasDiscount && baseCents > 0 && (
            <span className="text-sm line-through text-gray-300 font-medium">{formattedBase}</span>
          )}
        </div>

        {/* Size selector */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
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
                    "px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all tracking-wide",
                    selected
                      ? "bg-[#28543d] text-white border-[#28543d] shadow-sm"
                      : "bg-[#f5f0e8] text-[#28543d] border-[#28543d]/20 hover:border-[#28543d]/60"
                  )}
                  aria-pressed={selected}
                  aria-label={`Select size ${s.size || idx + 1}`}
                >
                  {s.size || `Size ${idx + 1}`}
                </button>
              );
            })}
          </div>
        )}

        {/* Batch dropdown */}
        {hasBatches && (
          <div className="mt-1 relative z-10" data-batch-dropdown>
            <div className="text-[10px] font-semibold text-[#28543d] mb-1 uppercase tracking-wider flex items-center gap-1">
              Select Batch
              {inCart && cartBatch && (
                <span className="text-emerald-600 normal-case font-medium">
                  · {cartBatch.name}
                </span>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  stopNav(e);
                  if (!inCart) setBatchDropdownOpen((prev) => !prev);
                }}
                disabled={inCart}
                className={cn(
                  "w-full px-3 py-1.5 rounded-xl border text-left transition text-xs flex items-center justify-between gap-1",
                  inCart
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : batchDropdownOpen
                    ? "bg-[#E7CE9D]/40 border-[#744531] text-[#744531]"
                    : "bg-[#f5f0e8] border-[#E7CE9D] text-[#613D38] hover:border-[#744531]/50"
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
                <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-[#E7CE9D] rounded-xl shadow-xl max-h-40 overflow-y-auto overflow-x-hidden">
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
                        "w-full px-3 py-2 text-left text-xs hover:bg-[#E7CE9D]/20 transition border-b border-[#E7CE9D]/30 last:border-0",
                        idx === selectedBatchIdx ? "bg-[#E7CE9D]/30" : ""
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#1a2e1a]">{b.name || "Unnamed"}</span>
                        {b.delivery_date && (
                          <span className="text-[9px] text-gray-500">
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
              <div className="mt-1 text-[10px] text-red-600 font-medium bg-red-50 rounded-lg px-2 py-1">
                {batchWarning}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Cart Actions */}
        <div className="mt-3 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
            whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
            onClick={isOutOfStock ? undefined : handleToggleCart}
            disabled={isOutOfStock}
            className={cn(
              "flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm transition-all duration-300",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : inCart
                ? "bg-[#f5f0e8] text-[#744531] hover:bg-[#E7CE9D]/50 border border-[#744531]/20"
                : "bg-[#28543d] hover:bg-[#1f4230] text-white shadow-xl shadow-[#28543d]/20"
            )}
          >
            {isOutOfStock ? "Out of Stock" : inCart ? "Remove" : "Add To Bag"}
          </motion.button>

          {!inCart && !isOutOfStock && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-[#E7CE9D] text-[#744531] hover:bg-[#dec186] shadow-xl shadow-[#E7CE9D]/20 transition-all duration-300"
            >
              Buy Now
            </motion.button>
          )}

          {inCart && (
            <div className="flex items-center gap-1 bg-[#f5f0e8] rounded-xl px-1">
              <button
                onClick={(e) => adjustQty(e, -1)}
                aria-label="Decrease quantity"
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#E7CE9D]/60 text-[#744531] text-sm font-bold transition"
              >
                −
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold text-[#744531]">
                {quantity}
              </span>
              <button
                onClick={(e) => adjustQty(e, 1)}
                aria-label="Increase quantity"
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#E7CE9D]/60 text-[#744531] text-sm font-bold transition"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Rating - Moved to end */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100/50">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(average_rating)
                    ? "fill-[#744531] text-[#744531]"
                    : "fill-gray-100 stroke-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">({review_count} Reviews)</span>
        </div>
      </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;