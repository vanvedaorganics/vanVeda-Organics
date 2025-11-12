// components/ProductDetails.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input } from "../components";
import { Star, Minus, Plus, ChevronDown } from "lucide-react";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  addItemOne,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";
import appwriteService from "../appwrite/appwriteConfigService";
import { Query } from "appwrite"; // used for advanced queries (optional)
import { motion } from "framer-motion";

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

function ProductDetails() {
  const { slug } = useParams();
  const products = useSelector((state) => state.products.items);
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData);
  const items = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery + size selection state
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // ⭐ Rating UI state
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // NEW: Batch state
  const [selectedBatchIdx, setSelectedBatchIdx] = useState(0);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchWarning, setBatchWarning] = useState("");

  // Users / addresses (for shipping address options)
  const users = useSelector((state) => state.users.items);
  const profileFromStore = useMemo(() => {
    const uid = userData?.$id || userData?.user_id || userData?.id;
    if (!uid || !Array.isArray(users)) return null;
    return users.find((u) => u.$id === uid) || null;
  }, [users, userData]);

  // parse address helper (local)
  const parseAddressArray = (addressArray) => {
    if (!Array.isArray(addressArray) || addressArray.length === 0) return [];
    return addressArray
      .map((addr) => {
        try {
          return JSON.parse(addr);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  };

  const profileAddresses = useMemo(() => {
    if (profileFromStore) return parseAddressArray(profileFromStore.address);
    return [];
  }, [profileFromStore]);

  // Subscription form state
  const [subQuantity, setSubQuantity] = useState(1);
  const [subInterval, setSubInterval] = useState("monthly"); // monthly | weekly
  const [subAddressIdx, setSubAddressIdx] = useState(0);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [showSubSuccess, setShowSubSuccess] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Load current user's rating for this product
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!product || !authStatus || !userData) {
          setUserRating(0);
          return;
        }
        const uid = userData?.$id || userData?.user_id || userData?.id;
        if (!uid) return;
        const review = await appwriteService.getUserReview(product.slug, uid);
        if (!active) return;
        setUserRating(Number(review?.rating || 0));
      } catch (e) {
        console.warn("Failed to load user review", e);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [product, authStatus, userData]);

  // Derived data from new schema
  const sizes = useMemo(
    () => (product ? parsePackagingSizes(product.packaging_size) : []),
    [product]
  );
  const hasSizes = sizes.length > 0;

  // NEW: Move batches useMemo here (before early returns)
  const batches = useMemo(
    () => (product ? parseBatches(product.batch) : []),
    [product]
  );
  const hasBatches = batches.length > 0;
  const selectedBatch = hasBatches ? batches[selectedBatchIdx] : null;

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

  const cartItem = useMemo(() => {
    if (!items || !product) return null;
    const legacy = items?.[product.slug];
    if (!cartKeyForSelected) return legacy;
    return items?.[cartKeyForSelected] ?? legacy;
  }, [items, product, cartKeyForSelected]);

  const quantity = useMemo(() => {
    if (!cartItem) return 0;
    return typeof cartItem === "number" ? cartItem : (cartItem?.qty ?? 0);
  }, [cartItem]);

  const cartBatch = useMemo(() => {
    if (!cartItem || typeof cartItem !== "object") return null;
    return cartItem?.batch || null;
  }, [cartItem]);

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
    if (typeof centsFromSize === "number" && centsFromSize > 0)
      return centsFromSize;
    const legacy =
      typeof product?.price_cents === "number" ? product.price_cents : 0;
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

  // Check if product already exists in cart with different batch (across all sizes)
  const getProductBatchInCart = useCallback(() => {
    if (!items || !product) return null;
    const allKeys = Object.keys(items);
    for (const key of allKeys) {
      if (key.startsWith(`${product.slug}${CART_KEY_SEP}`) || key === product.slug) {
        const item = items[key];
        const itemBatch = typeof item === "object" ? item?.batch : null;
        if (itemBatch) return itemBatch;
      }
    }
    return null;
  }, [items, product]);

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
      dispatch(changeItemQuantity({ slug: key, qty: n, batch: cartBatch || selectedBatch }));
    });
  };

  // Add/Remove for selected size
  const onAddToCartClick = () => {
    setBatchWarning("");

    ensureLoggedInThen(() => {
      const key = cartKeyForSelected || product.slug;

      // Require batch selection if product has batches
      if (hasBatches && !selectedBatch && quantity === 0) {
        setBatchWarning("Please select a batch before adding to cart");
        return;
      }

      if (quantity > 0) {
        dispatch(removeItemCompletely(key));
      } else {
        // Check if product already in cart with different batch
        const existingBatch = getProductBatchInCart();
        if (existingBatch && selectedBatch) {
          const isSameBatch =
            existingBatch.name === selectedBatch.name &&
            existingBatch.delivery_date === selectedBatch.delivery_date;
          
          if (!isSameBatch) {
            setBatchWarning(
              `This product is already in your cart with batch "${existingBatch.name}". Please remove existing items first or select the same batch.`
            );
            return;
          }
        }

        dispatch(addItemOne(key, selectedBatch));
      }
    });
  };

  // ⭐ Rate handler
  const onRate = async (value) => {
    if (value < 1 || value > 5 || !product) return;
    ensureLoggedInThen(async () => {
      try {
        const uid = userData?.$id || userData?.user_id || userData?.id;
        if (!uid) {
          navigate(`/login?returnTo=/product/${slug}`);
          return;
        }
        setSubmittingRating(true);
        setUserRating(value); // optimistic
        const updated = await appwriteService.rateProduct({
          product_id: product.slug,
          user_id: uid,
          rating: value,
        });
        // Refresh local product stats
        if (updated?.average_rating !== undefined) {
          setProduct((prev) =>
            prev
              ? {
                  ...prev,
                  average_rating: updated.average_rating,
                  review_count: updated.review_count,
                }
              : prev
          );
        }
      } catch (e) {
        console.error("Rating submission failed", e);
      } finally {
        setSubmittingRating(false);
      }
    });
  };

  const inCart = quantity > 0;

  const onThumbClick = useCallback((idx) => {
    setActiveImageIdx(idx);
  }, []);

  // Close batch dropdown on outside click
  useEffect(() => {
    if (!batchDropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest?.("[data-batch-dropdown-detail]")) {
        setBatchDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [batchDropdownOpen]);

  // Close batch dropdown on Escape
  useEffect(() => {
    if (!batchDropdownOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBatchDropdownOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [batchDropdownOpen]);

  // Reset subscription address when profile addresses change
  useEffect(() => {
    setSubAddressIdx(0);
  }, [profileAddresses.length]);

  const handleSubscribe = async () => {
    setSubError("");
    ensureLoggedInThen(async () => {
      try {
        if (!product) return;
        if (!selectedSize) {
          setSubError("Please select a packaging size.");
          return;
        }
        const quantity = Math.max(1, Math.floor(Number(subQuantity) || 1));
        if (quantity <= 0) {
          setSubError("Quantity must be at least 1.");
          return;
        }
        if (!profileAddresses || profileAddresses.length === 0) {
          setSubError("No shipping address found. Add an address in your profile.");
          return;
        }
        const addressObj = profileAddresses[subAddressIdx];
        if (!addressObj) {
          setSubError("Please select a valid shipping address.");
          return;
        }

        // stringify packaging_size as required (store sizeLabel + price_cents)
        const packagingObj = {
          sizeLabel: selectedSize.size || "",
          price_cents: typeof selectedSize.price_cents === "number" ? selectedSize.price_cents : 0,
        };
        const packaging_str = JSON.stringify(packagingObj);

        // stringify selected address
        const shippingAddressStr = JSON.stringify(addressObj);

        setSubLoading(true);

        // Prevent duplicate subscription: query for exact match
        const existing = await appwriteService.listSubscriptions({
          user_id: userData?.$id,
          product_id: product.slug,
          packaging_size: packaging_str,
          interval: subInterval,
        });

        if (Array.isArray(existing) && existing.length > 0) {
          setSubError("A subscription with same product, size and interval already exists.");
          setSubLoading(false);
          return;
        }

        // Create subscription
        await appwriteService.createSubscription({
          user_id: userData?.$id,
          product_id: product.slug,
          packaging_size: packaging_str,
          quantity,
          interval: subInterval,
          shippingAddress: shippingAddressStr,
        });

        setShowSubSuccess(true);
        // small delay then redirect to profile subscriptions tab
        setTimeout(() => {
          navigate("/profile/subscriptions");
        }, 1100);
      } catch (err) {
        console.error("Subscription failed", err);
        setSubError(err?.message || "Failed to create subscription.");
      } finally {
        setSubLoading(false);
      }
    });
  };

  // Replace the previous Success Modal behavior so redirect only happens on OK click
  const handleSubSuccessOk = () => {
    setShowSubSuccess(false);
    navigate("/profile/subscriptions");
  };

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
    <div
      className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans"
      aria-busy={submittingRating ? "true" : "false"}
    >
      {submittingRating && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full border-4 border-[#2D1D1A]/20 border-t-[#2D1D1A] animate-spin" />
            <span className="text-sm text-[#2D1D1A]">Submitting rating…</span>
          </div>
        </div>
      )}
      <div
        className={`mx-auto max-w-7xl ${
          submittingRating ? "pointer-events-none" : ""
        }`}
      >
        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          {/* Image + Gallery */}
          <div className="flex flex-col items-center">
            {/* Main Image */}
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-lg mb-4">
              <img
                src={mainImageUrl}
                alt={product.name}
                loading="lazy"
                role="img"
                aria-label={product.name}
                className="w-full h-full object-cover transform transition-transform duration-350 hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-gradient-to-br from-red-600 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
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
                        className={`relative h-20 rounded overflow-hidden border transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          isActive
                            ? "ring-2 ring-emerald-600 border-transparent scale-105"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                        onClick={() => onThumbClick(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onThumbClick(i);
                          }
                        }}
                        aria-pressed={isActive}
                        aria-label={`View image ${i + 1}`}
                        title={`View image ${i + 1}`}
                      >
                        <img
                          src={url}
                          alt={`${product.name} ${i + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder.svg")
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="w-full max-w-md mt-6 md:mt-8">
              <motion.div
                className="w-full bg-white border rounded-xl p-6 shadow-md"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-semibold syne-bold mb-2 tracking-tight">
                  Subscribe & Save
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Subscribe for recurring deliveries and never run out. Choose size,
                  quantity, interval and shipping address.
                </p>

                {/* Selected size summary */}
                <div className="mb-3">
                  <div className="text-sm font-semibold">Packaging</div>
                  <div className="mt-1 text-sm text-[#2D1D1A]">
                    {selectedSize ? (
                      <>
                        <span className="font-medium">
                          {selectedSize.size || "Default size"}
                        </span>
                        <span className="ml-2 text-gray-600">
                          • ₹{((selectedSize.price_cents || baseCents) / 100).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">No packaging selected</span>
                    )}
                  </div>
                </div>

                {/* Quantity + Interval */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Decrease subscription quantity"
                        title="Decrease"
                        onClick={() => setSubQuantity(Math.max(1, Number(subQuantity) - 1))}
                        className="hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={subQuantity}
                        aria-label="Subscription quantity"
                        onChange={(e) => setSubQuantity(Math.max(1, Number(e.target.value || 1)))}
                        className="w-24 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Increase subscription quantity"
                        title="Increase"
                        onClick={() => setSubQuantity(Number(subQuantity) + 1)}
                        className="hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Interval
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubInterval("monthly")}
                        className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                          subInterval === "monthly"
                            ? "bg-[#2D1D1A] text-white border-[#2D1D1A] shadow-md"
                            : "bg-white text-[#2D1D1A] border-[#2D1D1A]/20 hover:border-[#2D1D1A]/40"
                        }`}
                        aria-pressed={subInterval === "monthly"}
                        title="Monthly subscription"
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubInterval("weekly")}
                        className={`px-3 py-2 rounded-xl border-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                          subInterval === "weekly"
                            ? "bg-[#2D1D1A] text-white border-[#2D1D1A] shadow-md"
                            : "bg-white text-[#2D1D1A] border-[#2D1D1A]/20 hover:border-[#2D1D1A]/40"
                        }`}
                        aria-pressed={subInterval === "weekly"}
                        title="Weekly subscription"
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shipping address selector */}
                <div className="mt-4">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Shipping Address
                  </label>
                  {profileAddresses.length > 0 ? (
                    <select
                      value={subAddressIdx}
                      onChange={(e) => setSubAddressIdx(Number(e.target.value))}
                      className="w-full rounded-lg border p-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      aria-label="Select shipping address"
                    >
                      {profileAddresses.map((a, i) => (
                        <option key={i} value={i}>
                          {a.residencyAddress} • {a.city} {a.pincode}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-[#613D38]">
                      No saved addresses.{" "}
                      <a
                        href="/profile"
                        className="text-[#69A72A] underline"
                      >
                        Add address in profile
                      </a>
                    </div>
                  )}
                </div>

                {/* Error */}
                {subError && (
                  <div className="text-sm text-red-600 mt-3 p-2 bg-red-50 rounded">
                    {subError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleSubscribe}
                      size="lg"
                      className="w-full rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      disabled={subLoading}
                      aria-disabled={subLoading}
                    >
                      {subLoading ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </motion.div>

                  <div className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-[#2D1D1A] hover:bg-[#e7ce9d] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                      onClick={() => {
                        // quick preview: show subscription summary modal (optional)
                        setShowSubSuccess(false);
                        setSubError("");
                      }}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>

                {/* Success Modal (OK button required to redirect) */}
                {showSubSuccess && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <motion.div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="sub-success-title"
                      className="bg-white rounded-xl p-6 max-w-sm text-center shadow-lg"
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <h3 id="sub-success-title" className="text-lg font-semibold">
                        Subscription Created
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Your subscription has been created successfully.
                      </p>
                      <div className="mt-4 flex gap-3 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setShowSubSuccess(false)}
                          className="rounded-xl px-4 py-2"
                        >
                          Close
                        </Button>
                        <Button
                          onClick={handleSubSuccessOk}
                          className="rounded-xl bg-[#2D1D1A] text-white px-4 py-2"
                        >
                          OK
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
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
                        i < Math.floor(product.average_rating || 0)
                          ? "fill-[#2D1D1A] text-[#2D1D1A]"
                          : "fill-gray-300 stroke-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <span>({product.review_count || 0} reviews)</span>
              </div>

              {/* ⭐ Your Rating (interactive) */}
              <div className="mt-3">
                <div className="text-xs font-semibold text-[#2D1D1A] mb-1">
                  Your Rating
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-md border border-[#2D1D1A]/20 bg-white/70 ${submittingRating ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center" role="radiogroup" aria-label="Rate this product">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const active = (hoverRating || userRating) >= val;
                      return (
                        <button
                          key={val}
                          type="button"
                          aria-label={`Rate ${val} star${val > 1 ? "s" : ""}`}
                          role="radio"
                          aria-checked={userRating === val}
                          className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded"
                          onMouseEnter={() => setHoverRating(val)}
                          onMouseLeave={() => setHoverRating(0)}
                          onFocus={() => setHoverRating(val)}
                          onBlur={() => setHoverRating(0)}
                          onClick={() => onRate(val)}
                          title={
                            authStatus
                              ? `Click to rate ${val} star${val > 1 ? "s" : ""}`
                              : "Login to rate"
                          }
                        >
                          <Star
                            className={`h-6 w-6 transition ${active ? "fill-[#2D1D1A] text-[#2D1D1A]" : "fill-gray-200 stroke-gray-400 hover:fill-[#E7CE9D] hover:stroke-[#2D1D1A]" }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[12px] text-gray-600" aria-live="polite">
                    {userRating > 0
                      ? `You rated ${userRating}/5`
                      : "Tap a star to rate"}
                  </div>
                </div>
              </div>
            </div>

            {/* Packaging Size selector (styled) */}
            {hasSizes && (
              <div className="grid gap-2">
                <h2 className="text-base font-semibold">Packaging Size:</h2>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s, idx) => {
                    const selected = idx === selectedSizeIdx;
                    const perSizeKey = makeCartKey(product.slug, idx);
                    const perSizeItem = items?.[perSizeKey];
                    const perSizeQty = typeof perSizeItem === "number" ? perSizeItem : (perSizeItem?.qty ?? 0);
                    return (
                      <button
                        key={`${s.size}-${idx}`}
                        type="button"
                        className={`relative px-3 py-1.5 rounded border-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 transform ${
                          selected
                            ? "bg-[#2D1D1A] text-white border-[#2D1D1A] shadow-sm scale-105"
                            : "bg-white text-[#2D1D1A] border-[#2D1D1A] hover:bg-[#2D1D1A]/6"
                        }`}
                        onClick={() => {
                          setSelectedSizeIdx(idx);
                          setBatchWarning("");
                        }}
                        aria-pressed={selected}
                        title={`Select size ${s.size || idx + 1}`}
                      >
                        <span className="truncate max-w-[120px] inline-block align-middle">{s.size || `Size ${idx + 1}`}</span>
                        {perSizeQty > 0 && (
                          <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-[#E7CE9D] text-[#2D1D1A] text-[11px] flex items-center justify-center">
                            {perSizeQty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NEW: Batch dropdown selector */}
            {hasBatches && (
              <div className="grid gap-2 relative" data-batch-dropdown-detail>
                <h2 className="text-base font-semibold">
                  Available Batches:
                  {inCart && cartBatch && (
                    <span className="ml-2 text-sm text-emerald-600 font-normal">
                      (Selected: {cartBatch.name})
                    </span>
                  )}
                </h2>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (!inCart) {
                        setBatchDropdownOpen((prev) => !prev);
                      }
                    }}
                    disabled={inCart}
                    aria-expanded={batchDropdownOpen}
                    aria-haspopup="listbox"
                    className={`w-full px-3 py-2.5 rounded-lg border-2 text-left transition text-sm flex items-center justify-between gap-2 focus:outline-none ${
                      inCart
                        ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                        : batchDropdownOpen
                        ? "bg-[#E7CE9D] border-[#2D1D1A] text-[#2D1D1A] shadow-sm"
                        : "bg-white border-[#2D1D1A]/20 text-[#2D1D1A] hover:border-[#2D1D1A]/40 hover:bg-[#E7CE9D]/8"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="font-bold text-sm truncate">
                        {inCart && cartBatch
                          ? cartBatch.name || "Unnamed Batch"
                          : selectedBatch?.name || "Select a batch"}
                      </span>
                      {((inCart && cartBatch?.delivery_date) || (!inCart && selectedBatch?.delivery_date)) && (
                        <span className="text-xs opacity-75">
                          Delivery by: {inCart ? cartBatch.delivery_date : selectedBatch.delivery_date}
                        </span>
                      )}
                    </div>
                    {!inCart && (
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-transform ${batchDropdownOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {batchDropdownOpen && !inCart && (
                    <div className="absolute z-50 mt-2 left-0 right-0 bg-white border-2 border-[#2D1D1A]/20 rounded-lg shadow-xl max-h-64 overflow-y-auto" role="listbox" tabIndex={-1} aria-label="Select batch">
                      <div className="px-3 py-2 bg-[#E7CE9D]/20 border-b border-[#2D1D1A]/10 text-xs font-semibold text-[#2D1D1A]">
                        Select a batch
                      </div>
                      {batches.map((b, idx) => (
                        <button
                          key={`batch-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedBatchIdx(idx);
                            setBatchDropdownOpen(false);
                            setBatchWarning("");
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm hover:bg-[#E7CE9D]/20 transition border-b border-[#E7CE9D]/20 last:border-0 ${idx === selectedBatchIdx ? "bg-[#E7CE9D]/30" : ""}`}
                          role="option"
                          aria-selected={idx === selectedBatchIdx}
                          title={b.name || "Select batch"}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[#2D1D1A]">
                              {b.name || "Unnamed Batch"}
                            </span>
                            {b.delivery_date && (
                              <span className="text-xs text-[#613D38] opacity-75">
                                Delivery by: {b.delivery_date}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {batchWarning && (
                  <div className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-md p-2">
                    {batchWarning}
                  </div>
                )}
                <p className="text-[12px] text-gray-500">
                  {inCart
                    ? "Batch is locked once added to cart. Remove from cart to change batch."
                    : "Choose your preferred batch for delivery."}
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
                  aria-label="Decrease quantity"
                  onClick={() => updateQty(quantity - 1)}
                  disabled={quantity <= 0}
                  className="hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  aria-label="Cart item quantity"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    updateQty(Number.isNaN(v) ? 0 : v);
                  }}
                  className="w-20 text-center text-[#201413] border focus:border-[#201413] focus:ring-[#201413] focus:outline-none"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Increase quantity"
                  onClick={() => updateQty(quantity + 1)}
                  className="hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-4">
              <Button
                size="lg"
                className={`flex-1 rounded-xl text-white shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  inCart
                    ? "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                    : "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                }`}
                onClick={onAddToCartClick}
                aria-pressed={inCart}
                title={inCart ? "Remove from cart" : "Add to cart"}
              >
                {inCart ? "Remove From Cart" : "Add To Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-xl outline-[#2D1D1A] shadow-md hover:bg-[#e7ce9d] hover:shadow-lg transition-all duration-300 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                title="Buy now"
              >
                Buy Now
              </Button>
            </div>

            {/* Overview */}
            <div className="mt-6 border rounded-lg p-4 shadow-sm bg-white">
              <h2 className="syne-bold text-lg font-semibold mb-2">
                {product.name} Overview
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
