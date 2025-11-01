import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import appwriteAuthService from "../appwrite/authService";
import { Button, Input } from "../components";
import { User, Phone, Mail, MapPin, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

// Helper functions defined BEFORE component to avoid hoisting issues
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

const normalizeStatus = (status) => {
  return String(status || "pending").toLowerCase().trim();
};

const formatINR = (cents) => `₹${(Number(cents || 0) / 100).toFixed(2)}`;

const safeJSONParse = (str, fallback) => {
  try {
    return typeof str === "string" ? JSON.parse(str) : (str || fallback);
  } catch {
    return fallback;
  }
};

function Profile() {
  const authUser = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();
  const location = useLocation();

  // Use Redux orders directly (with realtime updates)
  const allOrders = useSelector((state) => state.orders.items);
  const ordersLoading = useSelector((state) => state.orders.loading);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [password, setPassword] = useState("");

  // Local filtered state for orders (triggers re-render on Redux changes)
  const [currentOrders, setCurrentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Derive active tab from route
  const initialTab = location.pathname.endsWith("/orders") ? "orders" : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Profile
  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await appwriteConfigService.getUserProfile(authUser.$id);
        const parsedAddresses = parseAddressArray(res.address);
        setProfile({ ...res, parsedAddress: parsedAddresses });
        setAddresses(parsedAddresses);
        reset({
          displayName: res.displayName || "",
          email: res.email || "",
          phone: res.phone || "",
        });
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser, navigate, reset]);

  // Filter and partition orders whenever Redux state changes
  useEffect(() => {
    if (!authUser) {
      setCurrentOrders([]);
      setPastOrders([]);
      return;
    }

    // Filter orders for current user
    const userOrders = allOrders.filter((order) => order.user_id === authUser.$id);

    // Partition into current and past
    const pastStatuses = new Set(["delivered", "cancelled"]);
    const current = [];
    const past = [];

    for (const order of userOrders) {
      const status = normalizeStatus(order.fulfillmentStatus);
      if (pastStatuses.has(status)) {
        past.push(order);
      } else {
        current.push(order);
      }
    }

    setCurrentOrders(current);
    setPastOrders(past);
  }, [allOrders, authUser]); // Re-run whenever allOrders or authUser changes

  const openModal = () => {
    reset({
      displayName: profile?.displayName || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
    });
    setAddresses(profile?.parsedAddress || []);
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      const addressArray = addresses.map((addr) => JSON.stringify(addr));

      // Handle email update separately → ask password first
      if (data.email !== profile.email) {
        setPendingEmail(data.email);
        setIsPasswordModalOpen(true);
        setSaving(false);
        return;
      }

      let isChanged = false;

      // Update name in Auth if changed
      if (data.displayName !== profile.displayName) {
        await appwriteAuthService.updateName({ name: data.displayName });
        isChanged = true;
      }

      // Update profile collection if any field changed
      if (
        data.displayName !== profile.displayName ||
        data.phone !== profile.phone ||
        JSON.stringify(addressArray) !== JSON.stringify(profile.address)
      ) {
        await appwriteConfigService.updateUserProfile({
          user_id: profile.$id,
          displayName: data.displayName,
          phone: data.phone,
          email: data.email,
          address: addressArray,
        });
        isChanged = true;
      }

      if (isChanged) {
        const updated = await appwriteConfigService.getUserProfile(profile.$id);
        const parsedAddresses = parseAddressArray(updated.address);
        setProfile({ ...updated, parsedAddress: parsedAddresses });
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Confirm Email Update with Password Modal
  const handleConfirmEmailUpdate = async () => {
    if (!pendingEmail || !password) {
      setError("Password is required to update email.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await appwriteAuthService.updateEmail({
        email: pendingEmail,
        password,
      });

      await appwriteConfigService.updateUserProfile({
        user_id: profile.$id,
        displayName: profile.displayName,
        phone: profile.phone,
        email: pendingEmail,
        address: profile.address,
      });

      const updated = await appwriteConfigService.getUserProfile(profile.$id);
      const parsedAddresses = parseAddressArray(updated.address);
      setProfile({ ...updated, parsedAddress: parsedAddresses });

      setIsPasswordModalOpen(false);
      setIsModalOpen(false);
      setPendingEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Failed to update email.");
    } finally {
      setSaving(false);
    }
  };

  // Address Handlers
  const addAddress = () => {
    if (addresses.length < 3) {
      setAddresses([
        ...addresses,
        { residencyAddress: "", landmark: "", street: "", pincode: "", city: "", state: "" },
      ]);
    }
  };

  const updateAddressField = (index, field, value) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  const removeAddress = (index) => {
    const updated = [...addresses];
    updated.splice(index, 1);
    setAddresses(updated);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">
        Profile not found. Try Reloading The Page, If that doesn't work please contact our team
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      <div className="mx-auto max-w-5xl bg-white rounded-2xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-[#2D1D1A] text-white shadow-md">
            <User className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#201413]">
              {profile.displayName}
            </h1>
            <p className="text-[#613D38]">Your Account</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => { setActiveTab("profile"); navigate("/profile"); }}
            className={`px-4 py-2 text-sm md:text-base font-semibold transition ${
              activeTab === "profile"
                ? "text-[#2D1D1A] border-b-2 border-[#2D1D1A]"
                : "text-gray-600 hover:text-[#2D1D1A]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => { setActiveTab("orders"); navigate("/profile/orders"); }}
            className={`px-4 py-2 text-sm md:text-base font-semibold transition ${
              activeTab === "orders"
                ? "text-[#2D1D1A] border-b-2 border-[#2D1D1A]"
                : "text-gray-600 hover:text-[#2D1D1A]"
            }`}
          >
            Orders
          </button>
        </div>

        {/* Error Banner */}
        {error && <div className="p-3 mt-4 rounded-lg bg-red-100 text-red-700">{error}</div>}

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" ? (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6"
            >
              {/* Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#2D1D1A]" />
                  <span className="text-lg text-[#201413]">{profile.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#2D1D1A]" />
                  <span className="text-lg text-[#201413]">{profile.phone}</span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-[#201413] flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Address
                  </h2>
                  {profile.parsedAddress?.length > 0 ? (
                    profile.parsedAddress.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4 shadow-sm border">
                        <p className="font-medium">{addr.residencyAddress}</p>
                        {addr.landmark && <p>{addr.landmark}</p>}
                        <p>{addr.street}</p>
                        <p>
                          {addr.pincode}, {addr.city}, {addr.state}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#613D38]">No address available</p>
                  )}
                </div>
              </div>

              {/* Edit Profile Action */}
              <div className="flex gap-4 mt-8">
                <Button
                  size="lg"
                  className="flex-1 rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg"
                  onClick={openModal}
                >
                  Edit Profile
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tab-orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6"
            >
              {/* Orders Loading */}
              {ordersLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-700"></div>
                </div>
              )}

              {/* Current Orders */}
              <section>
                <h3 className="syne-bold text-xl mb-3 text-[#201413]">Current Orders</h3>
                {currentOrders.length === 0 ? (
                  <p className="text-sm text-[#613D38]">No current orders.</p>
                ) : (
                  <div className="space-y-4">
                    {currentOrders.map((order) => (
                      <OrderCard
                        key={order.$id}
                        order={order}
                        formatINR={formatINR}
                        safeJSONParse={safeJSONParse}
                        normalizeStatus={normalizeStatus}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Past Orders */}
              <section className="mt-8">
                <h3 className="syne-bold text-xl mb-3 text-[#201413]">Past Orders</h3>
                {pastOrders.length === 0 ? (
                  <p className="text-sm text-[#613D38]">No past orders.</p>
                ) : (
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <OrderCard
                        key={order.$id}
                        order={order}
                        formatINR={formatINR}
                        safeJSONParse={safeJSONParse}
                        normalizeStatus={normalizeStatus}
                      />
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✨ Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg relative max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Display Name */}
                <div>
                  <Input
                    label="Display Name"
                    placeholder="Enter your full name"
                    {...register("displayName", { required: "Name is required" })}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-600">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email format",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="Enter your mobile number"
                    {...register("phone", {
                      required: "Phone is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Phone must be 10 digits",
                      },
                    })}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Address Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Addresses</h3>
                  {addresses.map((addr, idx) => (
                    <div key={idx} className="border rounded-lg p-4 flex flex-col gap-2">
                      <Input
                        label="Residency Address"
                        placeholder="Flat / Building / Residency"
                        value={addr.residencyAddress}
                        onChange={(e) => updateAddressField(idx, "residencyAddress", e.target.value)}
                      />
                      <Input
                        label="Landmark"
                        placeholder="Near park, mall..."
                        value={addr.landmark}
                        onChange={(e) => updateAddressField(idx, "landmark", e.target.value)}
                      />
                      <Input
                        label="Street"
                        placeholder="Street / Area"
                        value={addr.street}
                        onChange={(e) => updateAddressField(idx, "street", e.target.value)}
                      />
                      <Input
                        label="Pincode"
                        placeholder="Enter pincode"
                        value={addr.pincode}
                        onChange={(e) => updateAddressField(idx, "pincode", e.target.value)}
                      />
                      <Input
                        label="City"
                        placeholder="Enter city"
                        value={addr.city}
                        onChange={(e) => updateAddressField(idx, "city", e.target.value)}
                      />
                      <Input
                        label="State"
                        placeholder="Enter state"
                        value={addr.state}
                        onChange={(e) => updateAddressField(idx, "state", e.target.value)}
                      />
                      {addresses.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => removeAddress(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  {addresses.length < 3 && (
                    <Button
                      type="button"
                      onClick={addAddress}
                      className="bg-green-600 text-white"
                    >
                      Add Address
                    </Button>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#2D1D1A] text-white rounded-xl hover:bg-[#2D1D1A]/90"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Password Modal for Email Update */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Confirm Email Update</h2>
            <p className="text-gray-600 mb-4">
              To update your email to <b>{pendingEmail}</b>, please enter your current password.
            </p>
            <Input
              type="password"
              placeholder="Enter current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEmailUpdate}
                disabled={saving}
                className="bg-[#2D1D1A] text-white"
              >
                {saving ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// OrderCard component
function OrderCard({ order, formatINR, safeJSONParse, normalizeStatus }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const orderItems = safeJSONParse(order.items, { items: [], summary: {} });
  const shippingAddr = safeJSONParse(order.shippingAddress, null);

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeStatus(status);
    const badgeConfig = {
      delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
      shipped: { label: "Shipped", color: "bg-blue-100 text-blue-700" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
      processing: { label: "Processing", color: "bg-yellow-100 text-yellow-700" },
      pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
    };
    const config = badgeConfig[normalizedStatus] || badgeConfig.pending;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl p-4 bg-white shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-[#613D38]">
            Order ID: <span className="font-semibold text-[#2D1D1A]">{order.$id}</span>
          </div>
          <div className="text-xs text-gray-500">
            Placed on {new Date(order.$createdAt).toLocaleString()}
          </div>
          <div className="text-sm flex items-center gap-2">
            {getStatusBadge(order.fulfillmentStatus)}
            <span className="text-xs text-gray-600">
              Payment: {order.paymentMode || "COD"} ({order.paymentStatus || "Pending"})
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#2D1D1A] font-semibold">Total</div>
          <div className="text-lg font-bold">{formatINR(order.total_cents)}</div>
        </div>
      </div>

      {/* Address */}
      {shippingAddr && (
        <div className="mt-3 text-xs text-[#2D1D1A] bg-[#E7CE9D]/20 border border-[#2D1D1A]/10 rounded-md p-3">
          <div className="font-semibold mb-1">Shipping Address</div>
          <div>{shippingAddr.residencyAddress}</div>
          {shippingAddr.landmark && <div>{shippingAddr.landmark}</div>}
          <div>{shippingAddr.street}</div>
          <div>
            {shippingAddr.pincode}, {shippingAddr.city}, {shippingAddr.state}
          </div>
        </div>
      )}

      {/* Items toggle */}
      <div className="mt-3">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-sm font-semibold text-[#2D1D1A] hover:underline"
        >
          {isExpanded ? "Hide items" : "View items"}
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid gap-2">
                {Array.isArray(orderItems.items) && orderItems.items.length > 0 ? (
                  orderItems.items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 flex items-start justify-between">
                      <div className="text-sm">
                        <div className="font-semibold">{item.name}</div>
                        {item.packaging_size?.sizeLabel && (
                          <div className="text-xs text-gray-600">
                            Size: {item.packaging_size.sizeLabel}
                          </div>
                        )}
                        {item.batch && (item.batch.name || item.batch.delivery_date) && (
                          <div className="text-xs text-gray-700">
                            Batch: {item.batch.name}
                            {item.batch.delivery_date && ` • Delivery: ${item.batch.delivery_date}`}
                          </div>
                        )}
                        <div className="text-xs text-gray-600">Qty: {item.qty}</div>
                        <div className="text-xs text-gray-600">
                          Category: {item.categories || "-"}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>Unit: {formatINR(item.price_cents)}</div>
                        <div className="font-semibold">Line: {formatINR(item.item_total_cents)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#613D38]">No items to display.</div>
                )}
              </div>
              {/* Summary */}
              {orderItems.summary && (
                <div className="mt-3 text-right text-sm text-[#2D1D1A]">
                  Subtotal:{" "}
                  <span className="font-semibold">
                    {formatINR(orderItems.summary.subtotal_cents)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Profile;
