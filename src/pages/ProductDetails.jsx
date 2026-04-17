// components/ProductDetails.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input } from "../components";
import { Star, Minus, Plus, ChevronDown, ShoppingCart, Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  addItemOne,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";
import { setCartOpen } from "../store/uiSlice";
import appwriteService from "../appwrite/appwriteConfigService";
import { sendSubscriptionEmail } from "../utils/emailService";
import conf from "../conf/conf";
import { Query } from "appwrite"; // used for advanced queries (optional)
import { motion, AnimatePresence } from "framer-motion";

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



  // Subscription form state
  const [subQuantity, setSubQuantity] = useState(1);
  const [subWeeks, setSubWeeks] = useState(2); // NEW: selectable number of weeks
  const [subInterval, setSubInterval] = useState("weekly"); // weekly (fixed for now as duration is in weeks)
  const [subAddressIdx, setSubAddressIdx] = useState(0);
  const [subPaymentMethod, setSubPaymentMethod] = useState("Online"); // Online only for Subscriptions
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [showSubSuccess, setShowSubSuccess] = useState(false);
  const [profile, setProfile] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync profile and addresses
  useEffect(() => {
    if (authStatus && userData?.$id) {
       appwriteService.getUserProfile(userData.$id)
         .then(res => {
           setProfile(res);
         })
         .catch(err => console.error("Failed to fetch profile in ProductDetails", err));
    } else {
       setProfile(null);
    }
  }, [authStatus, userData]);

  const profileAddresses = useMemo(() => {
    if (profile?.address) return parseAddressArray(profile.address);
    if (profileFromStore) return parseAddressArray(profileFromStore.address);
    return [];
  }, [profile, profileFromStore]);

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

  // Stock awareness
  const stock = product?.stock;
  const isOutOfStock = typeof stock === "number" && stock === 0;
  const isLowStock = typeof stock === "number" && stock > 0 && stock <= 10;

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

  // Restore comprehensive image gallery logic
  const images = useMemo(() => {
    if (!product) return [];
    
    // 1. Start with top-level product images if they exist
    const globalImages = Array.isArray(product.images) ? product.images : [];
    
    // 2. Add size-specific images
    const sizeImages = Array.isArray(selectedSize?.images) ? selectedSize.images : [];
    
    // 3. Combine and remove duplicates while preserving order
    const combined = [...globalImages, ...sizeImages].filter(Boolean);
    return Array.from(new Set(combined));
  }, [product, selectedSize]);

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

  const onBuyNowClick = () => {
    setBatchWarning("");

    ensureLoggedInThen(() => {
      const key = cartKeyForSelected || product.slug;

      // Require batch selection if product has batches
      if (hasBatches && !selectedBatch && quantity === 0) {
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
            `This product is already in your cart with batch "${existingBatch.name}". Please remove existing items first or select the same batch.`
          );
          return;
        }
      }

      if (quantity === 0) {
        dispatch(addItemOne(key, selectedBatch));
      }
      navigate("/checkout");
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

        const sendSubscriptionNotification = (subId, qty, weeks, totalCents, addrStr) => {
          try {
            const addrObj = JSON.parse(addrStr);
            const formattedAddr = [
              addrObj.residencyAddress,
              addrObj.landmark,
              addrObj.street,
              `${addrObj.city} ${addrObj.pincode}`,
              addrObj.state,
            ].filter(Boolean).join(", ");

            sendSubscriptionEmail({
              subscriptionId: subId,
              customerName: userData.name || "Customer",
              customerEmail: userData.email || "",
              productName: product.name,
              interval: subInterval,
              quantity: qty,
              weeks: weeks,
              amount: `₹${(totalCents / 100).toFixed(2)}`,
              shippingAddress: formattedAddr,
            });
          } catch (e) {
            console.error("Failed to parse address for notification", e);
          }
        };

        const finalizeSubscription = async (paymentId = null, paymentStatus = "pending") => {
          try {
            const subDiscountedPrice = Math.round(discountedCents * 0.95);
            const totalCents = quantity * subDiscountedPrice * subWeeks;

            const res = await appwriteService.createSubscription({
              user_id: userData?.$id,
              product_id: product.slug,
              packaging_size: packaging_str,
              quantity,
              interval: subInterval,
              shippingAddress: shippingAddressStr,
              paymentMode: subPaymentMethod,
              paymentStatus: paymentStatus,
              payment_id: paymentId,
              total_cycles: subWeeks,
              is_upfront_paid: true,
            });

            // Send notification
            sendSubscriptionNotification(res.$id, quantity, subWeeks, totalCents, shippingAddressStr);

            setShowSubSuccess(true);
            setTimeout(() => {
              navigate("/profile/subscriptions");
            }, 1100);
          } catch (err) {
            console.error("Subscription finalization failed", err);
            setSubError(err?.message || "Failed to complete subscription.");
          } finally {
            setSubLoading(false);
          }
        };

        if (subPaymentMethod === "COD") {
          await finalizeSubscription(null, "pending");
        } else {
          // Razorpay integration for subscriptions - Dynamic weeks upfront with extra 5% discount
          const subDiscountedPrice = Math.round(discountedCents * 0.95);
          const amount = Math.round(quantity * subDiscountedPrice * subWeeks); // Total for selected weeks
          
          const options = {
            key: conf.razorpayKeyId,
            amount: amount,
            currency: "INR",
            name: "True Soil Organics",
            description: `Subscription: ${product.name} (${subInterval})`,
            image: "/Truesoil.png",
            handler: async function (response) {
              await finalizeSubscription(response.razorpay_payment_id, "paid");
            },
            prefill: {
              name: userData?.name || "",
              email: userData?.email || "",
            },
            theme: { color: "#28543d" },
            modal: {
              ondismiss: () => setSubLoading(false),
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", (response) => {
            setSubError(`Payment Failed: ${response.error.description}`);
            setSubLoading(false);
          });
          rzp.open();
        }
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
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E7CE9D] border-t-[#28543d]"></div>
        <p className="text-[#28543d] font-medium animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <div className="text-6xl text-gray-200">?</div>
        <h2 className="text-2xl font-bold text-[#744531]">Product not found</h2>
        <Button onClick={() => navigate("/products")} className="bg-[#28543d] text-white rounded-xl">
          Back to Products
        </Button>
      </div>
    );
  }

  const hasDiscount = Number(product.discount) > 0;

  return (
    <div
      className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-16 bg-[#fafafa] font-sans"
      aria-busy={submittingRating ? "true" : "false"}
    >
      {/* ── Submitting Overlay ────────────────────────────────────────── */}
      {submittingRating && (
        <div className="fixed inset-0 z-[60] bg-white/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-[#E7CE9D]/30">
            <div className="h-10 w-10 rounded-full border-4 border-[#744531]/10 border-t-[#744531] animate-spin" />
            <span className="text-sm font-semibold text-[#744531]">Submitting rating…</span>
          </div>
        </div>
      )}

      <div className={`mx-auto max-w-7xl ${submittingRating ? "pointer-events-none" : ""}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8 font-medium uppercase tracking-wider">
          <Link to="/" className="hover:text-[#28543d] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#28543d] transition-colors">Products</Link>
          <span>/</span>
          <span className="text-[#744531] truncate max-w-[150px]">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-start">
          
          {/* ── Left Column: Media ─────────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 z-10">
            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-[#E7CE9D]/20 group">
              <motion.img
                key={mainImageUrl}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                src={mainImageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
              {hasDiscount && (
                <div className="absolute top-6 left-6 bg-[#744531] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wider">
                  {product.discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images?.length > 1 && (
              <div className="px-2">
                <div className="flex flex-wrap gap-3">
                  {images.map((fid, i) => {
                    const isActive = i === activeImageIdx;
                    return (
                      <button
                        key={fid + i}
                        onClick={() => onThumbClick(i)}
                        className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                          isActive
                            ? "border-[#28543d] shadow-md scale-105"
                            : "border-transparent opacity-60 hover:opacity-100 hover:border-[#E7CE9D]"
                        }`}
                      >
                        <img
                          src={getImageUrl(fid)}
                          alt={`${product.name} thumbnail ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Content ──────────────────────────────────── */}
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <h1 className="syne-bold text-4xl md:text-5xl lg:text-6xl text-[#1a2e1a] leading-[1.1]">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-4 pt-2">
                <span className="text-4xl font-black text-[#744531]">
                  ₹{(discountedCents / 100).toFixed(2)}
                </span>
                {hasDiscount && baseCents > 0 && (
                  <span className="text-xl text-gray-400 line-through font-medium">
                    ₹{(baseCents / 100).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock status banner */}
              {isOutOfStock && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl px-4 py-2.5 text-sm">
                  <span className="text-lg">⚠️</span>
                  This product is currently <strong>out of stock</strong>. Check back soon!
                </div>
              )}
              {isLowStock && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl px-4 py-2.5 text-sm">
                  <span className="text-lg">🔥</span>
                  Only <strong>{stock} units left</strong> — order now before it runs out!
                </div>
              )}
            </div>

            <hr className="border-[#E7CE9D]/30" />

            {/* Packaging Size */}
            {hasSizes && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#28543d] uppercase tracking-widest flex items-center gap-2">
                  <span>Selection Packaging</span>
                  <span className="h-px flex-1 bg-[#28543d]/10"></span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((s, idx) => {
                    const isActive = idx === selectedSizeIdx;
                    const perSizeKey = makeCartKey(product.slug, idx);
                    const perSizeQty = typeof items?.[perSizeKey] === "number" ? items?.[perSizeKey] : (items?.[perSizeKey]?.qty ?? 0);
                    
                    return (
                      <button
                        key={`${s.size}-${idx}`}
                        onClick={() => {
                          setSelectedSizeIdx(idx);
                          setBatchWarning("");
                        }}
                        className={`relative px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                          isActive
                            ? "bg-[#28543d] text-white border-[#28543d] shadow-lg scale-105"
                            : "bg-white text-[#28543d] border-[#28543d]/10 hover:border-[#28543d]/40"
                        }`}
                      >
                        {s.size}
                        {perSizeQty > 0 && (
                          <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#E7CE9D] text-[#744531] text-xs flex items-center justify-center border-2 border-white shadow-sm">
                            {perSizeQty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Batch Selector */}
            {hasBatches && (
              <div className="space-y-3 relative" data-batch-dropdown-detail>
                <h3 className="text-xs font-bold text-[#28543d] uppercase tracking-widest flex items-center gap-2">
                  <span>Harvest Batch</span>
                  <span className="h-px flex-1 bg-[#28543d]/10"></span>
                </h3>
                <div className="relative">
                  <button
                    onClick={() => !inCart && setBatchDropdownOpen(!batchDropdownOpen)}
                    disabled={inCart}
                    className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                      inCart
                        ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                        : batchDropdownOpen
                        ? "bg-[#E7CE9D]/20 border-[#744531] text-[#744531]"
                        : "bg-white border-[#28543d]/10 text-[#744531] hover:border-[#744531]/40"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-sm">
                        {inCart && cartBatch ? cartBatch.name : selectedBatch?.name || "Select delivery batch"}
                      </p>
                      {((inCart && cartBatch?.delivery_date) || (!inCart && selectedBatch?.delivery_date)) && (
                        <p className="text-xs opacity-60 font-medium">Estimated Arrival: {inCart ? cartBatch.delivery_date : selectedBatch.delivery_date}</p>
                      )}
                    </div>
                    {!inCart && <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${batchDropdownOpen ? "rotate-180" : ""}`} />}
                  </button>

                  {batchDropdownOpen && !inCart && (
                    <div className="absolute z-50 mt-3 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-[#E7CE9D]/30 overflow-hidden ring-4 ring-black/5 animate-slide-up">
                      {batches.map((b, idx) => (
                        <button
                          key={`batch-${idx}`}
                          onClick={() => {
                            setSelectedBatchIdx(idx);
                            setBatchDropdownOpen(false);
                            setBatchWarning("");
                          }}
                          className={`w-full px-5 py-4 text-left transition-colors hover:bg-[#E7CE9D]/10 border-b border-[#E7CE9D]/10 last:border-0 ${
                            idx === selectedBatchIdx ? "bg-[#E7CE9D]/20 font-bold" : ""
                          }`}
                        >
                          <div className="text-sm font-bold text-[#1a2e1a]">{b.name}</div>
                          {b.delivery_date && <div className="text-xs text-gray-400 mt-0.5">Ship date: {b.delivery_date}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {batchWarning && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-pulse">
                    ⚠️ {batchWarning}
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Action Buttons Section */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 pt-6">
              {/* Quantity Selector - Full width on mobile, auto on desktop */}
              <div className="flex items-center justify-between bg-[#f5f0e8] rounded-2xl p-1.5 shadow-inner border border-black/[0.03] w-full lg:w-max">
                <button
                  onClick={() => updateQty(quantity - 1)}
                  disabled={quantity <= 0 || isOutOfStock}
                  className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-[#744531] transition-all disabled:opacity-30"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => updateQty(parseInt(e.target.value) || 0)}
                  className="w-16 bg-transparent text-center font-black text-lg text-[#744531] focus:outline-none"
                />
                <button
                  onClick={() => updateQty(quantity + 1)}
                  disabled={isOutOfStock}
                  className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-[#744531] transition-all disabled:opacity-30"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Action Buttons Group */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={isOutOfStock ? undefined : onAddToCartClick}
                  disabled={isOutOfStock}
                  className={`flex-1 min-h-[56px] rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-lg ${
                    isOutOfStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none"
                      : inCart
                      ? "bg-[#744531]/10 text-[#744531] border-2 border-[#744531]/20"
                      : "bg-[#28543d] text-white hover:bg-[#1f4230]"
                  }`}
                >
                  {isOutOfStock ? "Out of Stock" : inCart ? "Remove Product" : "Add to Bag"}
                </Button>
                
                {!inCart && !isOutOfStock && (
                  <Button
                    onClick={onBuyNowClick}
                    className="flex-1 min-h-[56px] rounded-2xl font-black text-sm uppercase tracking-widest bg-[#E7CE9D] text-[#744531] hover:bg-[#dec186] shadow-lg transition-all duration-300"
                  >
                    Buy Now
                  </Button>
                )}

                {/* Cart Toggle Button - Icon only */}
                <Button
                  onClick={() => dispatch(setCartOpen(true))}
                  className="h-14 w-full sm:w-14 rounded-2xl bg-[#f5f0e8] text-[#744531] flex items-center justify-center border-none shadow-lg hover:bg-[#E7CE9D]/30 transition-all active:scale-95"
                  title="Open Shopping Cart"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="sm:hidden ml-2 font-bold uppercase text-xs">View Cart</span>
                </Button>
              </div>
            </div>

            <hr className="border-[#E7CE9D]/30 my-4" />

            {/* Subscribe & Save Section */}
            {product.isSubscriptionAllowed && (
            <motion.div
              className="bg-white rounded-3xl border-2 border-[#E7CE9D]/40 p-8 shadow-xl relative overflow-hidden group mb-8"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-24 w-24 text-[#28543d]" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#28543d] flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="syne-bold text-xl text-[#1a2e1a]">Subscribe & Save Premium</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Unlock automated deliveries and priority harvest access. Never run out of your favorite organic staples again.
              </p>

              <div className="grid gap-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subscription Frequency</label>
                    <div className="flex p-1 bg-[#f5f0e8] rounded-xl">
                      {["weekly", "monthly"].map((int) => (
                        <button
                          key={int}
                          onClick={() => setSubInterval(int)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            subInterval === int ? "bg-white text-[#28543d] shadow-sm" : "text-gray-400"
                          }`}
                        >
                          {int.charAt(0).toUpperCase() + int.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duration (Weeks)</label>
                    <div className="relative">
                      <select
                        value={subWeeks}
                        onChange={(e) => setSubWeeks(Number(e.target.value))}
                        className="w-full bg-[#f5f0e8] rounded-xl px-4 py-3 text-[11px] font-bold text-[#28543d] appearance-none focus:outline-none border border-black/[0.03]"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((w) => (
                          <option key={w} value={w}>{w} Weeks</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#28543d] pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantity Per Week</label>
                    <div className="flex items-center bg-[#f5f0e8] rounded-xl px-3 h-[48px] border border-black/[0.03]">
                      <button onClick={() => setSubQuantity(Math.max(1, subQuantity - 1))} className="text-[#28543d] p-2 hover:bg-white rounded-lg transition-colors"><Minus className="h-4 w-4" /></button>
                      <input 
                        type="number" 
                        value={subQuantity} 
                        onChange={(e) => setSubQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 bg-transparent text-center font-bold text-sm text-[#28543d] focus:outline-none" 
                      />
                      <button onClick={() => setSubQuantity(subQuantity + 1)} className="text-[#28543d] p-2 hover:bg-white rounded-lg transition-colors"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Landmark</label>
                  {profileAddresses.length > 0 ? (
                    <div className="relative">
                      <select
                        value={subAddressIdx}
                        onChange={(e) => setSubAddressIdx(Number(e.target.value))}
                        className="w-full bg-[#f5f0e8] rounded-xl px-4 py-3 text-sm font-bold text-[#28543d] appearance-none focus:outline-none border border-black/[0.03]"
                      >
                        {profileAddresses.map((a, i) => (
                          <option key={i} value={i}>{a.city} · {a.pincode}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#28543d] pointer-events-none" />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-xs font-bold text-orange-800 flex items-center justify-between">
                      No saved addresses
                      <Link to="/profile" className="text-orange-600 underline">Add Now</Link>
                    </div>
                  )}
                </div>

                {/* Payment Method - Forced Online for Subscriptions */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</label>
                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#28543d] bg-[#28543d]/5 text-[#28543d]">
                      <span className="text-xs font-bold uppercase tracking-wider">Online Payment Only</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">COD is not available for recurring plans.</p>
                </div>

                <div className="bg-[#f5f0e8] p-4 rounded-xl border border-black/[0.03]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subscriber Discount</span>
                    <span className="text-xs font-black text-emerald-600">-5% EXTRA</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Upfront for {subWeeks} Weeks</span>
                    <span className="text-sm font-black text-[#28543d]">₹{((subQuantity * Math.round(discountedCents * 0.95) * subWeeks) / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-tight">Price includes all taxes. Paid once for {subWeeks} scheduled deliveries.</p>
                </div>

                {subError && <div className="p-3 bg-red-50 text-[11px] font-bold text-red-600 rounded-xl border border-red-100">{subError}</div>}

                <Button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full h-14 rounded-2xl bg-[#28543d] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#1f4230] transition-all hover:-translate-y-1"
                >
                  {subLoading ? "Securing Subscription..." : "Pay Upfront & Subscribe"}
                </Button>
              </div>
            </motion.div>
            )}

            {/* ── Ratings & Reviews ────────────────────────────────────────── */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xs font-bold text-[#744531] uppercase tracking-widest flex items-center gap-2 flex-1">
                  <span>Reviews & Rating</span>
                  <span className="h-px flex-1 bg-[#E7CE9D]/30"></span>
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#28543d]/10 rounded-full shrink-0">
                  <Star className="h-4 w-4 fill-[#28543d] text-[#28543d]" />
                  <span className="text-sm font-bold text-[#28543d]">
                    {product.average_rating?.toFixed(1) || "5.0"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">({product.review_count || 0})</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-2xl bg-[#E7CE9D]/10 border border-[#E7CE9D]/30 shadow-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const active = (hoverRating || userRating) >= val;
                    return (
                      <button
                        key={val}
                        type="button"
                        className="transition-transform active:scale-90 p-1"
                        onMouseEnter={() => setHoverRating(val)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => onRate(val)}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors duration-300 ${
                            active ? "fill-[#744531] text-[#744531]" : "fill-transparent text-[#744531]/40"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-sm font-bold text-[#744531]">
                  {userRating > 0 ? `You rated ${userRating}/5` : "How do you like this product? Rate it now."}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-bold text-[#28543d] uppercase tracking-widest flex items-center gap-2">
                <span>Product Philosophy</span>
                <span className="h-px flex-1 bg-[#28543d]/10"></span>
              </h3>
              <div className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {product.description}
              </div>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
               {[
                 { label: "100% Organic", icon: <CheckCircle2 className="h-4 w-4" /> },
                 { label: "Zero Pesticides", icon: <CheckCircle2 className="h-4 w-4" /> },
                 { label: "Lab Tested", icon: <CheckCircle2 className="h-4 w-4" /> },
                 { label: "Farm Fresh", icon: <CheckCircle2 className="h-4 w-4" /> }
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-[#28543d] py-2 px-3 rounded-xl bg-[#28543d]/5">
                   {feat.icon}
                   {feat.label}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSubSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#28543d] to-[#744531]" />
            <div className="h-20 w-20 rounded-full bg-[#28543d]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-[#28543d]" />
            </div>
            <h3 className="syne-bold text-2xl text-[#1a2e1a] mb-2">Subscription Active!</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Welcome to the family. Your recurring harvest deliveries have been secured.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowSubSuccess(false)}
                className="flex-1 rounded-xl h-12 text-gray-400 border-gray-200"
              >
                Dismiss
              </Button>
              <Button
                onClick={handleSubSuccessOk}
                className="flex-1 rounded-xl h-12 bg-[#28543d] text-white font-bold"
              >
                Go to Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
