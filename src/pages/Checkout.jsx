import { sendOrderEmail, sendAdminOrderAlert } from "../utils/emailService.js";
import { formatOrderId } from "../utils/orderUtils.js";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Input } from "../components";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  Truck,
  User,
  MapPin,
  Package,
  CalendarDays,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import appwriteService from "../appwrite/appwriteConfigService";
import conf from "../conf/conf";
import {
  selectCartItems,
  emptyUserCart,
  setEmptyCart,
} from "../store/cartsSlice";
import { addOrder } from "../store/ordersSlice";
import { fetchProducts } from "../store/productsSlice";

// Helpers copied to keep in sync with cart structure
const CART_KEY_SEP = "::";
const parseCartKey = (key) => {
  if (!key || typeof key !== "string") return null;
  const idx = key.indexOf(CART_KEY_SEP);
  if (idx === -1) return { slug: key, sizeIdx: null }; // legacy key
  const slug = key.slice(0, idx);
  const sizeIdxStr = key.slice(idx + CART_KEY_SEP.length);
  const sizeIdx = Number.isNaN(Number(sizeIdxStr)) ? null : Number(sizeIdxStr);
  return { slug, sizeIdx };
};

const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (!cents || d <= 0) return cents || 0;
  return Math.round((cents * (100 - d)) / 100);
};

// dd-mm-yyyy -> Date
const parseDdMmYyyy = (str) => {
  if (!str || typeof str !== "string") return null;
  const [dd, mm, yyyy] = str.split("-").map((p) => Number(p));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
};

// Date -> dd-mm-yyyy
const formatDdMmYyyy = (d) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// NEW: Toast notification component
const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-4 right-4 z-[100] max-w-md w-full ${
        type === "error"
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      } border-2 rounded-xl shadow-xl p-4 flex items-start gap-3`}
    >
      {type === "error" ? (
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p
          className={`text-sm font-semibold ${
            type === "error" ? "text-red-900" : "text-green-900"
          }`}
        >
          {type === "error" ? "Order Failed" : "Success"}
        </p>
        <p
          className={`text-sm mt-1 ${
            type === "error" ? "text-red-700" : "text-green-700"
          }`}
        >
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${
          type === "error"
            ? "text-red-400 hover:text-red-600"
            : "text-green-400 hover:text-green-600"
        }`}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

// NEW: User-friendly error message mapper
const getUserFriendlyError = (error) => {
  const message = error?.message || String(error);
  const code = error?.code || error?.response?.code;

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    code === "ECONNREFUSED"
  ) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // Authentication errors
  if (
    code === 401 ||
    message.includes("unauthorized") ||
    message.includes("not authenticated")
  ) {
    return "Your session has expired. Please log in again to continue.";
  }

  // Permission errors
  if (
    code === 403 ||
    message.includes("permission") ||
    message.includes("forbidden")
  ) {
    return "You don't have permission to place this order. Please contact support.";
  }

  // Validation errors
  if (
    code === 400 ||
    message.includes("validation") ||
    message.includes("invalid")
  ) {
    return "Some information is missing or incorrect. Please check your details and try again.";
  }

  // Server errors
  if (
    code >= 500 ||
    message.includes("server error") ||
    message.includes("internal")
  ) {
    return "Our server is experiencing issues. Please try again in a few moments.";
  }

  // Cart/product errors
  if (message.includes("cart") || message.includes("product")) {
    return "There was an issue with your cart items. Please refresh the page and try again.";
  }

  // Address errors
  if (message.includes("address")) {
    return "Please check your shipping address and ensure all required fields are filled correctly.";
  }

  // Payment errors
  if (message.includes("payment")) {
    return "There was an issue processing your payment information. Please try again.";
  }

  // Generic fallback
  return "We couldn't complete your order. Please try again or contact our support team if the problem persists.";
};

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authUser = useSelector((s) => s.auth.userData);
  const authStatus = useSelector((s) => s.auth.status);
  const items = useSelector(selectCartItems);
  const products = useSelector((s) => s.products.items);
  const productsFetched = useSelector((s) => s.products.fetched);
  const productsLoading = useSelector((s) => s.products.loading);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    residencyAddress: "",
    landmark: "",
    street: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [placing, setPlacing] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState("COD");
  const [error, setError] = useState(null); // NEW: error state for toast
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Pull profile + addresses
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const boot = async () => {
      try {
        if (!authStatus || !authUser) {
          navigate("/login?returnTo=/checkout");
          return;
        }
        const res = await appwriteService.getUserProfile(authUser.$id);
        let parsedAddress = [];
        if (Array.isArray(res.address) && res.address.length > 0) {
          parsedAddress = res.address
            .map((a) => {
              try {
                return JSON.parse(a);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }
        setProfile(res);
        setAddresses(parsedAddress);
        setSelectedAddressIdx(parsedAddress.length > 0 ? 0 : null);
      } catch (e) {
        console.error("Failed to load profile", e);
        setError(getUserFriendlyError(e));
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [authStatus, authUser, navigate]);

  // NEW: Fetch products if not available
  useEffect(() => {
    if (!productsFetched && !productsLoading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, productsFetched, productsLoading]);

  // Build cart rows (read-only)
  const cartRows = useMemo(() => {
    if (!items || !products) return [];
    return Object.entries(items)
      .map(([key, itemData]) => {
        const parsed = parseCartKey(key);
        if (!parsed) return null;
        const product = products.find((p) => p.slug === parsed.slug);
        if (!product) return null;

        const qty =
          typeof itemData === "number" ? itemData : itemData?.qty ?? 0;
        if (!qty) return null;

        const packaging = product.packaging_size || [];
        const sizeObj =
          typeof parsed.sizeIdx === "number" && packaging[parsed.sizeIdx]
            ? packaging[parsed.sizeIdx]
            : null;

        const sPrice = Number(sizeObj?.price_cents);
        const baseCents = (!isNaN(sPrice) && sPrice > 0) 
          ? sPrice 
          : (Number(product?.price_cents) || 0);

        const unitCents = discountPrice(baseCents, product.discount || 0);

        return {
          cartKey: key,
          slug: product.slug,
          name: product.name,
          discountPercent: product.discount || 0,
          qty,
          sizeLabel: sizeObj?.size || null,
          unitCents,
          baseCents,
          batch: typeof itemData === "object" ? itemData?.batch : null,
          categories: product?.categories || null, // reuse later
          allowed_payment_modes: product?.allowed_payment_modes || ["COD", "ONLINE"], // NEW
        };
      })
      .filter(Boolean);
  }, [items, products]);

  const totals = useMemo(() => {
    const subtotalCents = cartRows.reduce(
      (acc, row) => acc + row.unitCents * (row.qty || 0),
      0
    );
    return {
      subtotalCents,
      itemCount: cartRows.reduce((acc, r) => acc + (r.qty || 0), 0),
      currency: "INR",
    };
  }, [cartRows]);

  useEffect(() => {
    if (!loading && cartRows.length === 0 && !isSuccess) {
      navigate("/products");
    }
  }, [loading, cartRows.length, navigate, isSuccess]);

  const farthestDeliveryDate = useMemo(() => {
    // among items with batch.delivery_date pick furthest; else today+10
    const dates = cartRows
      .map((r) => r.batch?.delivery_date)
      .filter(Boolean)
      .map(parseDdMmYyyy)
      .filter((d) => d instanceof Date && !isNaN(d.getTime()));

    if (dates.length === 0) {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return formatDdMmYyyy(d);
    }
    const far = new Date(Math.max(...dates.map((d) => d.getTime())));
    return formatDdMmYyyy(far);
  }, [cartRows]);

  const selectedAddress = useMemo(() => {
    if (useNewAddress) return newAddress;
    if (selectedAddressIdx === null) return null;
    return addresses[selectedAddressIdx] || null;
  }, [useNewAddress, selectedAddressIdx, addresses, newAddress]);

  const isCODAllowed = useMemo(() => {
    return cartRows.every((row) => row.allowed_payment_modes?.includes("COD"));
  }, [cartRows]);

  // If COD is not allowed but selected, switch to Card
  useEffect(() => {
    if (!isCODAllowed && paymentChoice === "COD") {
      setPaymentChoice("Card");
    }
  }, [isCODAllowed, paymentChoice]);

  const canPlace =
    !placing &&
    cartRows.length > 0 &&
    profile &&
    selectedAddress &&
    // minimal address validation
    String(selectedAddress?.pincode || "").trim().length >= 4 &&
    String(selectedAddress?.city || "").trim() &&
    String(selectedAddress?.state || "").trim();

  const handlePlaceOrder = async () => {
    if (!canPlace) return;

    try {
      setPlacing(true);
      setError(null);

      // Validate cart has items
      if (cartRows.length === 0) {
        throw new Error(
          "Your cart is empty. Please add items before placing an order."
        );
      }

      // Validate profile exists
      if (!profile?.$id) {
        throw new Error(
          "Unable to load your profile. Please refresh and try again."
        );
      }

      // Validate address
      if (!selectedAddress) {
        throw new Error(
          "Please select a shipping address before placing your order."
        );
      }

      const addressValidation = [
        { field: selectedAddress.pincode, name: "Pincode" },
        { field: selectedAddress.city, name: "City" },
        { field: selectedAddress.state, name: "State" },
        { field: selectedAddress.residencyAddress, name: "Address" },
      ];

      for (const { field, name } of addressValidation) {
        if (!String(field || "").trim()) {
          throw new Error(
            `${name} is required. Please complete your shipping address.`
          );
        }
      }

      // Build ultra-compact items payload — Appwrite items field limit is 1000 chars
      // Use short keys: n=name, q=qty, p=price(cents), t=item_total_cents, s=size
      const orderItems = cartRows.map((r) => ({
        n: r.name.slice(0, 40),
        q: r.qty,
        p: r.unitCents,
        t: r.unitCents * r.qty,
        s: (r.sizeLabel || "").slice(0, 20),
      }));

      // Compact address keys to fit within 512 chars
      const compactAddress = selectedAddress ? {
        ra: selectedAddress.residencyAddress,
        lm: selectedAddress.landmark,
        st: selectedAddress.street,
        pc: selectedAddress.pincode,
        ct: selectedAddress.city,
        s: selectedAddress.state
      } : null;

      const shippingAddress = JSON.stringify(compactAddress).slice(0, 510);

      // Function to handle the actual Appwrite document creation
      const submitOrderToAppwrite = async (paymentId = null, pMode = "COD") => {
        // Keep items JSON tight — must be under 1000 chars
        let safeItems = [...orderItems];
        let itemsJson = JSON.stringify(safeItems);
        while (itemsJson.length > 990 && safeItems.length > 1) {
          safeItems.pop();
          itemsJson = JSON.stringify(safeItems);
        }

        const payload = {
          user_id: authUser.$id,
          items: itemsJson,
          shippingAddress,
          total_cents: totals.subtotalCents,
          paymentMode: pMode,
          paymentStatus: paymentId ? "Paid" : "Pending",
          userName: profile.displayName || "",
          userPhone: profile.phone || "",
          userEmail: authUser.email || "",
        };

        const result = await appwriteService.createOrder(payload);
        // Immediately add to Redux so it shows in Profile without reload
        dispatch(addOrder(result));
        await finalizeSuccess(result);
      };

      const finalizeSuccess = async (result) => {
        // NEW: Deduct stock for all items in order
        try {
          await Promise.allSettled(
            cartRows.map((row) =>
              appwriteService.updateProductStock(row.slug, row.qty)
            )
          );
        } catch (stockErr) {
          console.error("Stock deduction failed", stockErr);
        }

        dispatch(emptyUserCart());
        dispatch(setEmptyCart());
        setPlacedOrder(result);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setError({
          type: "success",
          message: "Order placed successfully!",
        });
        
        // NEW: Send Order Notifications
        sendOrderNotifications(result);
      };

      const sendOrderNotifications = async (order) => {
        try {
          const orderId = formatOrderId(order.$id);
          const amount = `₹${(order.total_cents / 100).toFixed(2)}`;
          const customerName = profile.displayName || "Customer";
          const customerEmail = authUser.email || "";
          const paymentMode = order.paymentMode || "COD";

          // Format items for a readable email list (supports compact keys n/q/t and legacy name/qty/item_total_cents)
          const itemsListText = orderItems
            .map(
              (item) =>
                `${item.n || item.name} x ${item.q ?? item.qty} — ₹${((item.t ?? item.item_total_cents) / 100).toFixed(2)}`
            )
            .join("\n");

          const addressObj = selectedAddress || {};
          const formattedAddress = [
            addressObj.residencyAddress,
            addressObj.landmark,
            addressObj.street,
            `${addressObj.city} ${addressObj.pincode}`,
            addressObj.state,
          ]
            .filter(Boolean)
            .join(", ");

          // 1️⃣ Customer confirmation email (fire-and-forget)
          sendOrderEmail({
            orderId: `#${orderId}`,
            customerName,
            customerEmail,
            amount,
            paymentMode,
            deliveryDate: farthestDeliveryDate,
            itemsList: itemsListText,
            shippingAddress: formattedAddress,
          });

          // 2️⃣ Admin alert email (fire-and-forget)
          sendAdminOrderAlert({
            orderId: `#${orderId}`,
            customerName,
            customerEmail,
            amount,
            paymentMode,
            deliveryDate: farthestDeliveryDate,
            itemsList: itemsListText,
            shippingAddress: formattedAddress,
          });
        } catch (err) {
          console.error("Failed to trigger notifications", err);
        }
      };

      if (paymentChoice === "COD") {
        await submitOrderToAppwrite(null, "COD");
      } else {
        // Razorpay Integration
        const options = {
          key: conf.razorpayKeyId,
          amount: totals.subtotalCents, // Amount is in currency subunits (paise)
          currency: "INR",
          name: "True Soil Organics",
          description: `Order for ${totals.itemCount} items`,
          image: "https://truesoilorganics.com/Truesoil.png", // Use a hosted URL to avoid Mixed Content/CORS warnings
          handler: async function (response) {
            try {
              setPlacing(true);
              // response.razorpay_payment_id
              await submitOrderToAppwrite(
                response.razorpay_payment_id,
                "Card" // Changed from "ONLINE" to match Appwrite enum
              );
            } catch (err) {
              console.error("DEBUG: Order placement failed after Razorpay success.");
              console.error("DEBUG: Error Details:", err);
              console.error("DEBUG: Response Code:", err?.code || err?.response?.code);
              console.error("DEBUG: Response Message:", err?.message || err?.response?.message);
              setError({
                type: "error",
                message: `Payment captured but failed to save order: ${err.message || "Unknown error"}. Please contact support.`,
              });
            } finally {
              setPlacing(false);
            }
          },
          prefill: {
            name: profile.displayName || "",
            email: authUser.email || "",
            contact: profile.phone || "",
          },
          theme: {
            color: "#744531",
          },
          modal: {
            ondismiss: function () {
              setPlacing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          setError({
            type: "error",
            message: `Payment Failed: ${response.error.description}`,
          });
          setPlacing(false);
        });
        rzp.open();
      }
    } catch (e) {
      console.error("Failed to place order", e);
      setError({ type: "error", message: getUserFriendlyError(e) });
    } finally {
      // For COD, we stop loading here. For Razorpay, the modal handler handles it.
      if (paymentChoice === "COD") {
        setPlacing(false);
      }
    }
  };

  // Auto-open "Add new address" form when no saved addresses
  useEffect(() => {
    if (!loading && addresses.length === 0) {
      setUseNewAddress(true);
    }
  }, [loading, addresses.length]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      {/* NEW: Toast notifications */}
      <AnimatePresence>
        {error && (
          <Toast
            message={error.message || error}
            type={error.type || "error"}
            onClose={() => setError(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading || productsLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center h-[60vh]"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center border border-[#E7CE9D]/30"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="syne-bold text-3xl md:text-4xl text-[#201413] mb-4">
              Thank You for Your Order!
            </h2>
            <p className="ubuntu-regular text-lg text-[#613d38] mb-8">
              Your order has been placed successfully and is now being processed by our Farmers at Gir.
            </p>

            <div className="bg-[#FAF8F4] rounded-2xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-bold text-[#744531]">#{formatOrderId(placedOrder?.$id)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Delivery:</span>
                <span className="font-bold text-[#28543d]">{farthestDeliveryDate}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-[#744531]">₹{((placedOrder?.total_cents || totals.subtotalCents) / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#E7CE9D]/20 border border-[#E7CE9D] rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-bold text-[#744531] uppercase tracking-wider mb-3">
                Quick Action
              </h3>
              <p className="text-sm text-[#613d38] mb-4">
                Please notify us on WhatsApp for faster processing of your order.
              </p>
              <Button
                onClick={() => {
                  const orderId = formatOrderId(placedOrder?.$id);
                  const amount = (placedOrder.total_cents / 100).toFixed(2);
                  const msg = encodeURIComponent(
                    `Hello True Soil Organics, I just placed an order!\n\nOrder ID: #${orderId}\nCustomer: ${profile.displayName}\nAmount: ₹${amount}\n\nPlease confirm my order. Thank you!`
                  );
                  window.open(`https://wa.me/919082716034?text=${msg}`, "_blank");
                }}
                className="w-full bg-[#28543d] hover:bg-[#1f4230] text-white py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-5 h-5" alt="WA" />
                Notify on WhatsApp
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/profile/orders")}
                className="bg-[#744531] hover:bg-[#744531]/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => navigate("/products")}
                variant="outline"
                className="border-[#744531] text-[#744531] hover:bg-[#744531]/10 px-8 py-3 rounded-xl transition-all"
              >
                Continue Shopping
              </Button>
            </div>
            
            <p className="mt-8 text-sm text-gray-500 italic">
              A confirmation message has been sent to your registered email.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: Address + Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#744531]" />
                  <h2 className="text-xl font-bold text-[#201413]">
                    Shipping Address
                  </h2>
                </div>

                {addresses.length === 0 && !useNewAddress && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      No saved address found. Please add one to continue.
                    </span>
                  </motion.div>
                )}

                {addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                          selectedAddressIdx === idx && !useNewAddress
                            ? "border-[#744531] bg-[#E7CE9D]/20"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setUseNewAddress(false);
                          setSelectedAddressIdx(idx);
                        }}
                      >
                        <input
                          type="radio"
                          name="addr"
                          className="mt-1"
                          checked={selectedAddressIdx === idx && !useNewAddress}
                          onChange={() => {
                            setUseNewAddress(false);
                            setSelectedAddressIdx(idx);
                          }}
                        />
                        <div>
                          <div className="font-semibold">
                            {addr.residencyAddress}
                          </div>
                          {addr.landmark ? (
                            <div className="text-sm">{addr.landmark}</div>
                          ) : null}
                          <div className="text-sm">{addr.street}</div>
                          <div className="text-sm">
                            {addr.pincode}, {addr.city}, {addr.state}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* New Address Toggle */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setUseNewAddress((v) => !v);
                      setSelectedAddressIdx(null);
                    }}
                    className="text-sm font-semibold text-[#744531] hover:underline"
                  >
                    {useNewAddress ? "Use Saved Address" : "Add New Address"}
                  </button>
                </div>

                {/* New Address Form */}
                <AnimatePresence>
                  {useNewAddress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-semibold text-[#744531] bg-[#E7CE9D]/20 border border-[#744531]/20 rounded-md p-3 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>
                          All fields marked with * are required to place your
                          order
                        </span>
                      </motion.div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Residency Address *"
                          placeholder="House/Flat, Building, Area"
                          value={newAddress.residencyAddress}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              residencyAddress: e.target.value,
                            }))
                          }
                          required
                        />
                        <Input
                          label="Landmark"
                          placeholder="Nearby landmark (optional)"
                          value={newAddress.landmark}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              landmark: e.target.value,
                            }))
                          }
                        />
                        <Input
                          label="Street *"
                          placeholder="Street / Locality"
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              street: e.target.value,
                            }))
                          }
                          required
                        />
                        <Input
                          label="Pincode *"
                          placeholder="6-digit pincode"
                          value={newAddress.pincode}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              pincode: e.target.value,
                            }))
                          }
                          required
                        />
                        <Input
                          label="City *"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              city: e.target.value,
                            }))
                          }
                          required
                        />
                        <Input
                          label="State *"
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress((s) => ({
                              ...s,
                              state: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#744531]" />
                  <h2 className="text-xl font-bold text-[#201413]">Payment</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => isCODAllowed && setPaymentChoice("COD")}
                    disabled={!isCODAllowed}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                      !isCODAllowed 
                        ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                        : paymentChoice === "COD"
                          ? "border-[#744531] bg-[#E7CE9D]/20"
                          : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Wallet className={`w-6 h-6 ${!isCODAllowed ? "text-gray-400" : "text-[#744531]"}`} />
                    <div className="text-left">
                      <div className={`font-semibold ${!isCODAllowed ? "text-gray-400" : ""}`}>Cash on Delivery</div>
                      <div className="text-xs text-gray-600">
                        {isCODAllowed ? "Pay when the order arrives" : "Not available for one or more items"}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentChoice("RAZORPAY")}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                      paymentChoice === "RAZORPAY"
                        ? "border-[#744531] bg-[#E7CE9D]/20"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-[#744531]" />
                    <div className="text-left">
                      <div className="font-semibold">Razor Pay</div>
                      <div className="text-xs text-gray-600">
                        UPI/Card will be chosen at random
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-[#744531]" />
                  <h2 className="text-xl font-bold text-[#201413]">
                    Order Summary
                  </h2>
                </div>

                {/* Cart items (read-only) */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {cartRows.map((row) => (
                    <div
                      key={row.cartKey}
                      className="flex items-start justify-between gap-3 border rounded-lg p-3"
                    >
                      <div className="flex flex-col">
                        <div className="font-semibold">{row.name}</div>
                        {row.sizeLabel && (
                          <div className="text-xs text-gray-600">
                            Size: {row.sizeLabel}
                          </div>
                        )}
                        {row.batch &&
                        (row.batch.name || row.batch.delivery_date) ? (
                          <div className="text-xs text-[#744531]">
                            Batch: {row.batch.name}
                            {row.batch.delivery_date
                              ? ` • Delivery: ${row.batch.delivery_date}`
                              : ""}
                          </div>
                        ) : null}
                        <div className="text-xs text-gray-600">
                          Qty: {row.qty}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[#744531] font-semibold">
                          ₹{(row.unitCents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: ₹{((row.unitCents * row.qty) / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery ETA */}
                <div className="mt-4 flex items-center gap-2 text-sm text-[#744531]">
                  <Truck className="w-4 h-4" />
                  <span className="font-semibold">Estimated Delivery</span>
                  <CalendarDays className="w-4 h-4 ml-1" />
                  <span>{farthestDeliveryDate}</span>
                </div>

                {/* Totals */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between text-[#744531]">
                    <span className="font-semibold flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" /> Payable
                    </span>
                    <span className="text-lg font-bold">
                      ₹{(totals.subtotalCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={!canPlace || placing}
                  className={`w-full mt-4 rounded-xl ${
                    canPlace && !placing
                      ? "bg-[#744531] hover:bg-[#744531]/90"
                      : "bg-gray-300 cursor-not-allowed"
                  } text-white shadow-md hover:shadow-lg transition-all duration-300`}
                >
                  {placing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Placing Order...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                {!selectedAddress && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-600 mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>
                      Please select or add a shipping address to continue.
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Checkout;
