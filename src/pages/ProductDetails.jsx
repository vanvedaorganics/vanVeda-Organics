// components/ProductDetails.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input } from "../components";
import { Star, Minus, Plus } from "lucide-react";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  addItemOne,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";

// Helpers for new schema
const parsePackagingSizes = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      try {
        const obj = typeof item === "string" ? JSON.parse(item) : item || {};
        return {
          size: obj?.size || "",
          price_cents:
            typeof obj?.price_cents !== "undefined"
              ? Number(obj.price_cents)
              : undefined,
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
  if (!cents || d <= 0) return cents || 0;
  return Math.round((cents * (100 - d)) / 100);
};

// cart key helpers: `${slug}::${sizeIdx}`
const CART_KEY_SEP = "::";
const makeCartKey = (slug, sizeIdx) => `${slug}${CART_KEY_SEP}${sizeIdx}`;

function ProductDetails() {
  const { slug } = useParams();
  const products = useSelector((state) => state.products.items);
  const authStatus = useSelector((state) => state.auth.status);
  const items = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery + size selection state
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Resolve product by slug (kept same)
  useEffect(() => {
    if (products?.length > 0) {
      const found = products.find((p) => p.slug === slug);
      setProduct(found || null);
      setLoading(false);
      // Reset local UI state when product changes
      setSelectedSizeIdx(0);
      setActiveImageIdx(0);
    }
  }, [products, slug]);

  // Derived data from new schema
  const sizes = useMemo(
    () => (product ? parsePackagingSizes(product.packaging_size) : []),
    [product]
  );
  const hasSizes = sizes.length > 0;

  const selectedSize = hasSizes
    ? sizes[Math.min(selectedSizeIdx, sizes.length - 1)]
    : null;

  // Per-size cart key and current quantity
  const cartKeyForSelected = useMemo(() => {
    if (!product) return null;
    return makeCartKey(
      product.slug,
      Math.min(selectedSizeIdx, Math.max(0, sizes.length - 1))
    );
  }, [product, selectedSizeIdx, sizes.length]);

  const quantity = useMemo(() => {
    if (!items) return 0;
    const legacy = Number(items?.[product?.slug] || 0);
    if (!cartKeyForSelected) return legacy;
    return Number(items?.[cartKeyForSelected] ?? legacy ?? 0);
  }, [items, product?.slug, cartKeyForSelected]);

  // Images for selected size
  const images = useMemo(() => {
    const list = Array.isArray(selectedSize?.images) ? selectedSize.images : [];
    return list;
  }, [selectedSize]);

  // Main display image
  const mainImageUrl = useMemo(() => {
    const fid = images?.[activeImageIdx] || images?.[0];
    return fid ? getImageUrl(fid) : "/placeholder.svg";
  }, [images, activeImageIdx]);

  // Price (per selected size, fallback to legacy)
  const baseCents = useMemo(() => {
    const centsFromSize =
      typeof selectedSize?.price_cents === "number"
        ? selectedSize.price_cents
        : undefined;
    if (typeof centsFromSize === "number" && centsFromSize > 0) return centsFromSize;
    const legacy = typeof product?.price_cents === "number" ? product.price_cents : 0;
    return legacy;
  }, [selectedSize, product]);

  const discountedCents = useMemo(
    () => discountPrice(baseCents, product?.discount || 0),
    [baseCents, product?.discount]
  );

  // Reset gallery when size changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedSizeIdx]);

  const ensureLoggedInThen = (cb) => {
    if (!authStatus || authStatus === false) {
      navigate(`/login?returnTo=/product/${slug}`);
      return;
    }
    cb();
  };

  // Update qty for selected size using composite cart key
  const updateQty = (newQty) => {
    ensureLoggedInThen(() => {
      const key = cartKeyForSelected || product.slug;
      const n = Math.max(0, Math.floor(Number(newQty) || 0));
      dispatch(changeItemQuantity({ slug: key, qty: n }));
    });
  };

  // Add/Remove for selected size
  const onAddToCartClick = () => {
    ensureLoggedInThen(() => {
      const key = cartKeyForSelected || product.slug;
      if (quantity > 0) {
        dispatch(removeItemCompletely(key));
      } else {
        dispatch(addItemOne(key));
      }
    });
  };

  const inCart = quantity > 0;

  const onThumbClick = useCallback((idx) => {
    setActiveImageIdx(idx);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">
        Product not found
      </div>
    );
  }

  const hasDiscount = Number(product.discount) > 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          {/* Image + Gallery */}
          <div className="flex flex-col items-center">
            {/* Main Image */}
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-lg mb-4">
              <img
                src={mainImageUrl}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
              {hasDiscount && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold">
                  {product.discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails Gallery (for selected size) */}
            {images?.length > 0 && (
              <div className="w-full max-w-md">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {images.map((fid, i) => {
                    const url = getImageUrl(fid);
                    const isActive = i === activeImageIdx;
                    return (
                      <button
                        type="button"
                        key={fid + i}
                        className={`relative h-20 rounded overflow-hidden border ${
                          isActive
                            ? "ring-2 ring-emerald-600 border-transparent"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                        onClick={() => onThumbClick(i)}
                        title="View image"
                      >
                        <img
                          src={url}
                          alt={`${product.name} ${i + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid gap-6">
            <div>
              <h1 className="syne-bold text-3xl md:text-4xl text-[#201413]">
                {product.name}
              </h1>

              {/* Price (per selected size) */}
              <div className="roboto-bold mt-4 text-3xl font-bold text-[#2D1D1A]">
                ₹{(discountedCents / 100).toFixed(2)}
                {hasDiscount && baseCents > 0 && (
                  <span className="ml-2 text-base text-[#613D38] line-through">
                    ₹{(baseCents / 100).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-[#2D1D1A] text-[#2D1D1A]"
                          : "fill-gray-300 stroke-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <span>({product.reviews || 0} reviews)</span>
              </div>
            </div>

            {/* Packaging Size selector (styled) */}
            {hasSizes && (
              <div className="grid gap-2">
                <h2 className="text-base font-semibold">Packaging Size:</h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s, idx) => {
                    const selected = idx === selectedSizeIdx;
                    // Quantity badge for this size from cart
                    const perSizeKey = makeCartKey(product.slug, idx);
                    const perSizeQty = Number(items?.[perSizeKey] || 0);
                    return (
                      <button
                        key={`${s.size}-${idx}`}
                        type="button"
                        className={`relative px-3 py-1.5 rounded border-2 text-sm font-bold transition ${
                          selected
                            ? "bg-[#2D2D1A] text-white border-[#2D2D1A]"
                            : "bg-white text-[#2D2D1A] border-[#2D2D1A] hover:bg-[#2D2D1A]/10"
                        }`}
                        onClick={() => setSelectedSizeIdx(idx)}
                        aria-pressed={selected}
                        title={`Select size ${s.size || idx + 1}`}
                      >
                        {s.size || `Size ${idx + 1}`}
                        {perSizeQty > 0 && (
                          <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-[#E7CE9D] text-[#2D1D1A] text-[11px] flex items-center justify-center">
                            {perSizeQty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[12px] text-gray-500">
                  Images and price update for the selected size.
                </p>
              </div>
            )}

            {/* Quantity selector (per selected size) */}
            <div className="grid gap-2 mt-2">
              <h2 className="text-base font-semibold">Quantity:</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQty(quantity - 1)}
                  disabled={quantity <= 0}
                  className="hover:bg-gray-100"
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
                  className="w-20 text-center text-[#201413] border focus:border-[#201413] focus:ring-[#201413]"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQty(quantity + 1)}
                  className="hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-4">
              <Button
                size="lg"
                className={`flex-1 ${
                  inCart
                    ? "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                    : "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                } text-white shadow-md hover:shadow-lg transition-all duration-300`}
                onClick={onAddToCartClick}
              >
                {inCart ? "Remove From Cart" : "Add To Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 outline-[#2D1D1A] shadow-md hover:bg-[#e7ce9d] hover:shadow-lg transition-all duration-300 bg-transparent"
              >
                Buy Now
              </Button>
            </div>

            {/* Overview */}
            <div className="mt-6 border rounded-lg p-4 shadow-sm bg-white">
              <h2 className="syne-bold text-lg font-semibold mb-2">
                {product.name} Overview
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;