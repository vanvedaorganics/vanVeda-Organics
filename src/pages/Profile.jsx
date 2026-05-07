import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import appwriteAuthService from "../appwrite/authService";
import { logout } from "../store/authSlice";
import { updateOrder, fetchUserOrders } from "../store/ordersSlice";
import { Button, Input } from "../components";
import { 
  User, Phone, Mail, MapPin, X, LogOut, Package, 
  Calendar, CreditCard, ChevronRight, Settings,
  Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

// Helper functions
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
  const dispatch = useDispatch();
  const location = useLocation();

  const allOrders = useSelector((state) => state.orders.items);
  const ordersLoading = useSelector((state) => state.orders.loading);
  const ordersError = useSelector((state) => state.orders.error);
  const products = useSelector((state) => state.products.items);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const [currentOrders, setCurrentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const initialTab = location.pathname.endsWith("/orders")
    ? "orders"
    : location.pathname.endsWith("/subscriptions")
    ? "subscriptions"
    : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }
    // Specific fetch for this user's orders (more reliable than global list)
    dispatch(fetchUserOrders(authUser.$id));
    const fetchProfile = async () => {
      if (!authUser?.$id) return;
      try {
        const res = await appwriteConfigService.getUserProfile(authUser.$id);
        
        if (!res) {
          setProfile(null);
          return;
        }

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

  useEffect(() => {
    if (!authUser) {
      setCurrentOrders([]);
      setPastOrders([]);
      return;
    }

    const uid = String(authUser.$id || "").toLowerCase();
    const pid = String(profile?.$id || "").toLowerCase();

    const userOrders = allOrders.filter((order) => {
      // Handle relationship object or plain ID string
      const orderUid = String(order.user_id?.$id || order.user_id || "").toLowerCase();
      return orderUid === uid || orderUid === pid;
    });
    const pastStatuses = new Set(["delivered", "cancelled"]);
    const current = [];
    const past = [];

    for (const order of userOrders) {
      const status = normalizeStatus(order.fulfillmentStatus || order.fulfillmentSattus);
      if (pastStatuses.has(status)) {
        past.push(order);
      } else {
        current.push(order);
      }
    }

    setCurrentOrders(current);
    setPastOrders(past);
  }, [allOrders, authUser, profile]);

  useEffect(() => {
    let active = true;
    const loadSubs = async () => {
      if (!profile) {
        setSubscriptions([]);
        return;
      }
      setSubsLoading(true);
      try {
        const docs = await appwriteConfigService.listSubscriptions({ user_id: profile.$id });
        if (!active) return;
        const parsed = (docs || []).map((d) => {
          let pack = d.packaging_size;
          try { pack = typeof pack === "string" ? JSON.parse(pack) : pack; } catch { pack = { sizeLabel: "", price_cents: 0 }; }
          let ship = d.shippingAddress;
          try { ship = typeof ship === "string" ? JSON.parse(ship) : ship; } catch { ship = null; }
          return { ...d, parsedPackaging: pack, parsedShipping: ship };
        });
        setSubscriptions(parsed);
      } catch (err) {
        console.error("Failed to load subscriptions", err);
      } finally {
        if (active) setSubsLoading(false);
      }
    };
    loadSubs();
    return () => { active = false; };
  }, [profile]);

  const handleUnsubscribe = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      setSubsLoading(true);
      await appwriteConfigService.deleteSubscription(subscriptionId);
      // Refresh list
      const docs = await appwriteConfigService.listSubscriptions({ user_id: profile.$id });
      const parsed = (docs || []).map((d) => {
        let pack = d.packaging_size;
        try { pack = typeof pack === "string" ? JSON.parse(pack) : pack; } catch { pack = { sizeLabel: "", price_cents: 0 }; }
        let ship = d.shippingAddress;
        try { ship = typeof ship === "string" ? JSON.parse(ship) : ship; } catch { ship = null; }
        return { ...d, parsedPackaging: pack, parsedShipping: ship };
      });
      setSubscriptions(parsed);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      setError("Failed to unsubscribe: " + (err.message || "Unknown error"));
      alert("Failed to unsubscribe. " + (err.message || "Please try again."));
    } finally {
      setSubsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await appwriteAuthService.logout();
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      setError("Logout failed. Please try again.");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      // Pass as fulfillmentStatus — updateOrder will remap to fulfillmentSattus
      const updatedOrder = await appwriteConfigService.updateOrder(orderId, {
        fulfillmentStatus: "cancelled",
        cancelReason: reason || "User cancelled",
      });
      dispatch(updateOrder(updatedOrder));
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Failed to cancel order: " + err.message);
    }
  };

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

      // 1. Handle Email update (requires password confirmation)
      if (profile && data.email !== profile.email) {
        setPendingEmail(data.email);
        setIsPasswordModalOpen(true);
        setSaving(false);
        return;
      }

      const userId = profile?.$id || authUser?.$id;
      if (!userId) throw new Error("User ID missing");

      // Validation: All address fields are mandatory except Landmark
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        if (
          !addr.residencyAddress?.trim() ||
          !addr.street?.trim() ||
          !addr.pincode?.trim() ||
          !addr.city?.trim() ||
          !addr.state?.trim()
        ) {
          throw new Error(
            `Incomplete address details in Address ${i + 1}. Please fill all fields except Landmark.`
          );
        }
      }

      // 2. Determine if we are creating or updating
      if (!profile) {
        // Create Profile
        await appwriteConfigService.createUserProfile({
          user_id: userId,
          displayName: data.displayName,
          phone: data.phone,
          email: data.email,
          address: addressArray,
        });
      } else {
        // Update Profile
        let isChanged = false;
        if (data.displayName !== profile.displayName) {
          await appwriteAuthService.updateName({ name: data.displayName });
          isChanged = true;
        }

        if (
          data.displayName !== profile.displayName ||
          data.phone !== profile.phone ||
          JSON.stringify(addressArray) !== JSON.stringify(profile.address)
        ) {
          await appwriteConfigService.updateUserProfile({
            user_id: userId,
            displayName: data.displayName,
            phone: data.phone,
            email: data.email,
            address: addressArray,
          });
          isChanged = true;
        }
      }

      // 3. Refresh profile data
      const updated = await appwriteConfigService.getUserProfile(userId);
      const parsedAddresses = parseAddressArray(updated?.address || []);
      setProfile({ ...updated, parsedAddress: parsedAddresses });
      setIsModalOpen(false);
      
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEmailUpdate = async () => {
    if (!pendingEmail || !password) {
      setError("Password is required to update email.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await appwriteAuthService.updateEmail({ email: pendingEmail, password });
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

  const addAddress = () => {
    if (addresses.length < 3) {
      setAddresses([...addresses, { residencyAddress: "", landmark: "", street: "", pincode: "", city: "", state: "" }]);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#faf8f4]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#28543d]"></div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen px-4 bg-[#faf8f4] text-center pt-20 pb-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-[#E7CE9D]/20 max-w-md w-full">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="syne-bold text-2xl text-[#201413] mb-4">Welcome, {authUser?.name || "User"}!</h2>
          <p className="text-gray-500 mb-8 font-medium">It looks like your profile details are missing. Click below to complete your setup.</p>
          
          {error && <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold">{error}</div>}
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                reset({
                  displayName: authUser?.name || "",
                  email: authUser?.email || "",
                  phone: "",
                });
                setAddresses([{ residencyAddress: "", landmark: "", street: "", pincode: "", city: "", state: "" }]);
                setIsModalOpen(true);
              }} 
              className="w-full py-4 bg-[#28543d] text-white rounded-2xl font-bold hover:bg-[#744531] transition-all shadow-lg active:scale-95"
            >
              Complete Profile
            </button>
            <button onClick={handleLogout} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold active:scale-95 transition-all">Sign Out</button>
          </div>
        </motion.div>
        
        {/* Render Modal even if profile is missing so we can create it */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#faf8f4]">
                <h2 className="syne-bold text-2xl text-[#201413]">Complete Profile</h2>
                <button className="text-gray-400 hover:text-black transition-colors" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto no-scrollbar flex-1">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Input label="Name" placeholder="Full Name" {...register("displayName", { required: "Required" })} error={errors.displayName?.message} />
                  <Input label="Email" type="email" placeholder="Email" {...register("email", { required: "Required" })} error={errors.email?.message} />
                  <Input label="Phone" type="tel" placeholder="Phone" {...register("phone", { required: "Required", pattern: { value: /^[0-9]{10}$/, message: "10 digits required" } })} error={errors.phone?.message} />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="syne-bold text-lg">Shipping Addresses</h3><button type="button" onClick={addAddress} className="text-sm font-black text-[#28543d] hover:underline">+ Add New</button></div>
                    {addresses.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4 relative">
                        {addresses.length > 1 && <button type="button" onClick={() => removeAddress(idx)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>}
                        <Input label="Residency Address" value={addr.residencyAddress} onChange={(e) => updateAddressField(idx, "residencyAddress", e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Landmark" value={addr.landmark} onChange={(e) => updateAddressField(idx, "landmark", e.target.value)} />
                          <Input label="Street" value={addr.street} onChange={(e) => updateAddressField(idx, "street", e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <Input label="Pincode" value={addr.pincode} onChange={(e) => updateAddressField(idx, "pincode", e.target.value)} />
                          <Input label="City" value={addr.city} onChange={(e) => updateAddressField(idx, "city", e.target.value)} />
                          <Input label="State" value={addr.state} onChange={(e) => updateAddressField(idx, "state", e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-8">
                    <Button type="submit" className="w-full bg-[#744531] text-white rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-[#28543d] transition-all" disabled={saving}>
                      {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : "Save & Continue"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#faf8f4] font-sans pb-20">
      <div className="h-48 bg-[#28543d] w-full relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-24 relative z-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(40,84,61,0.08)] overflow-hidden border border-[#E7CE9D]/20">
          {/* Header */}
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-[#E7CE9D]/10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#744531] to-[#28543d] flex items-center justify-center text-white shadow-2xl relative z-10">
                  <User className="w-16 h-16" />
                </div>
                <div className="absolute inset-0 bg-[#E7CE9D] rounded-[2rem] rotate-6 -z-0 opacity-20 group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-[#28543d] rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-green-100">
                  Member Since {new Date(profile.$createdAt).getFullYear()}
                </div>
                <h1 className="syne-bold text-4xl md:text-5xl text-[#201413]">{profile.displayName}</h1>
                <p className="text-gray-400 font-medium flex items-center gap-2 justify-center md:justify-start italic"><Mail className="w-4 h-4" /> {profile.email}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={openModal} className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E7CE9D]/40 rounded-2xl text-[#744531] font-bold text-sm transition-all hover:bg-gray-50 active:scale-95"><Settings className="w-4 h-4" /> Edit</button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-50 rounded-2xl text-red-600 font-bold text-sm transition-all hover:bg-red-100 active:scale-95"><LogOut className="w-4 h-4" /> Sign Out</button>
            </div>
          </div>

          {/* Nav */}
          <div className="px-8 pt-6">
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {[
                { id: "profile", label: "My Profile", icon: User },
                { id: "orders", label: "Orders", icon: Package },
                { id: "subscriptions", label: "Subscriptions", icon: Calendar },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); navigate(`/profile${tab.id === 'profile' ? '' : '/' + tab.id}`); }}
                  className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-bold text-sm transition-all relative ${activeTab === tab.id ? "text-[#28543d] bg-[#faf8f4] border-t border-x border-[#E7CE9D]/20 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]" : "text-gray-400 hover:text-[#744531] hover:bg-gray-50"}`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#28543d]' : 'text-gray-400'}`} />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="active-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#28543d] rounded-t-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12 bg-[#faf8f4]">
            <AnimatePresence mode="wait">
              {activeTab === "profile" ? (
                <motion.div key="tab-profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E7CE9D]/10">
                      <h3 className="syne-bold text-[#744531] uppercase text-[10px] tracking-[0.2em] mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E7CE9D]" />Verified</h3>
                      <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"><Mail className="w-5 h-5 text-[#28543d]" /></div>
                          <div><p className="text-[10px] uppercase font-black text-gray-400">Email</p><p className="text-sm font-bold text-[#201413]">{profile.email}</p></div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center"><Phone className="w-5 h-5 text-[#28543d]" /></div>
                          <div><p className="text-[10px] uppercase font-black text-gray-400">Phone</p><p className="text-sm font-bold text-[#201413]">{profile.phone}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-[#E7CE9D]/10 h-full">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="syne-bold text-2xl text-[#201413] flex items-center gap-3"><MapPin className="w-6 h-6 text-[#744531]" />Address Book</h2>
                        <button onClick={openModal} className="text-[#28543d] text-sm font-black hover:underline">Manage</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.parsedAddress?.length > 0 ? profile.parsedAddress.map((addr, idx) => (
                          <div key={idx} className="group relative bg-[#faf8f4] rounded-3xl p-6 border border-transparent hover:border-[#E7CE9D]/30 transition-all duration-300">
                            <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-[#E7CE9D]">{idx === 0 ? 'Primary' : `Address ${idx + 1}`}</div>
                            <div className="space-y-2 pt-2">
                              <p className="font-bold text-[#201413] text-lg leading-tight uppercase tracking-tight syne-bold">{addr.residencyAddress}</p>
                              {addr.landmark && <p className="text-xs text-[#744531]/70 font-medium">Near {addr.landmark}</p>}
                              <div className="pt-2 text-sm text-gray-500 font-medium space-y-1">
                                <p>{addr.street}</p>
                                <p className="text-[#28543d] font-bold">{addr.city}, {addr.state} — {addr.pincode}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-2 py-12 text-center border-2 border-dashed border-[#E7CE9D]/20 rounded-[2rem]">
                            <p className="text-gray-400 font-medium">No saved addresses.</p>
                            <button onClick={openModal} className="mt-4 text-[#744531] font-bold text-sm hover:underline">+ Add Address</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "subscriptions" ? (
                <motion.div key="tab-subscriptions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="syne-bold text-2xl text-[#201413]">Active Subscriptions</h3>
                  </div>
                  {subsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-[#E7CE9D]/10">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#28543d]"></div>
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] border border-[#E7CE9D]/10 text-center">
                      <Calendar className="w-12 h-12 text-[#E7CE9D]/40 mx-auto mb-4" />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No recurring plans</p>
                      <Link to="/" className="inline-block mt-6 text-[#744531] font-black hover:underline">Explore Products</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subscriptions.map((s) => {
                        const product = products?.find((p) => p.slug === s.product_id);
                        const productName = product?.name || s.product_id;
                        const priceCents = Number(s.parsedPackaging?.price_cents || 0);
                        return (
                          <div key={s.$id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-[#E7CE9D]/10 flex flex-col h-full group hover:shadow-xl transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center"><Package className="w-6 h-6 text-[#28543d]" /></div>
                                <div>
                                  <h4 className="syne-bold text-lg text-[#201413] leading-tight">{productName}</h4>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#744531]/60">{s.interval} Delivery</p>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-green-100 text-[#28543d] rounded-full text-[9px] font-black uppercase tracking-widest">{s.status}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                              <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-1">Qty</p>
                                <p className="text-xs font-bold text-[#201413]">{s.quantity} /wk</p>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[9px] uppercase font-black text-gray-400 mb-1">Size</p>
                                <p className="text-xs font-bold text-[#201413]">{s.parsedPackaging?.sizeLabel || "-"}</p>
                              </div>
                              <div className="p-3 bg-[#28543d]/5 rounded-2xl border border-[#28543d]/10">
                                <p className="text-[9px] uppercase font-black text-[#28543d] mb-1">Cycles</p>
                                <p className="text-xs font-bold text-[#28543d]">{s.remaining_cycles || s.total_cycles || 1}/{s.total_cycles || 1}</p>
                              </div>
                            </div>
                            <div className="mt-auto space-y-4">
                              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-xs font-bold text-[#744531] uppercase tracking-widest">Next Delivery</div>
                                <div className="text-xs font-black text-[#28543d]">{s.nextOrderAt ? new Date(s.nextOrderAt).toLocaleDateString() : "-"}</div>
                              </div>
                              <div className="p-4 bg-[#744531] rounded-2xl text-white flex justify-between items-center group-hover:bg-[#28543d] transition-colors">
                                <span className="text-[11px] font-black tracking-widest uppercase opacity-75">Subscription Price</span>
                                <span className="syne-bold text-lg">{formatINR(priceCents * s.quantity)}</span>
                              </div>
                              <button
                                onClick={() => handleUnsubscribe(s.$id)}
                                className="w-full py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors border-2 border-transparent hover:border-red-100 rounded-2xl"
                              >
                                Cancel Subscription
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="tab-orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                  {ordersLoading && <div className="flex justify-center items-center py-20 bg-white rounded-[2rem]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#28543d]"></div></div>}
                  {ordersError && (
                    <div className="p-4 mb-6 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 text-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-bold"><AlertCircle size={16} /> Data Fetching Issue</div>
                      <p>We're having trouble loading your full order history. This usually happens if database indexes are missing or permissions are restricted. Any orders placed in this session should still appear below.</p>
                      <p className="text-[10px] opacity-70">Technical details: {ordersError}</p>
                    </div>
                  )}
                  <section>
                    <div className="flex items-center gap-3 mb-6"><div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div><h3 className="syne-bold text-xl text-[#201413]">Active Orders</h3><div className="h-px flex-1 bg-gray-100" /></div>
                    {currentOrders.length === 0 ? <div className="bg-white p-12 rounded-[2rem] border border-[#E7CE9D]/10 text-center"><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No active shipments</p></div> : (
                      <div className="space-y-6">{currentOrders.map((o) => <OrderCard key={o.$id} order={o} formatINR={formatINR} safeJSONParse={safeJSONParse} normalizeStatus={normalizeStatus} onCancel={handleCancelOrder} />)}</div>
                    )}
                  </section>
                  <section>
                    <div className="flex items-center gap-3 mb-6"><div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-600" /></div><h3 className="syne-bold text-xl text-[#201413]">Complete History</h3><div className="h-px flex-1 bg-gray-100" /></div>
                    {pastOrders.length === 0 ? <div className="bg-white p-12 rounded-[2rem] border border-[#E7CE9D]/10 text-center"><p className="text-sm font-bold text-gray-400 uppercase tracking-widest">History is empty</p></div> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{pastOrders.map((o) => <OrderCard key={o.$id} order={o} formatINR={formatINR} safeJSONParse={safeJSONParse} normalizeStatus={normalizeStatus} onCancel={handleCancelOrder} />)}</div>
                    )}
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#faf8f4]">
              <h2 className="syne-bold text-2xl text-[#201413]">Edit Profile</h2>
              <button className="text-gray-400 hover:text-black transition-colors" onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 overflow-y-auto no-scrollbar flex-1">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input label="Name" placeholder="Full Name" {...register("displayName", { required: "Required" })} error={errors.displayName?.message} />
                <Input label="Email" type="email" placeholder="Email" {...register("email", { required: "Required" })} error={errors.email?.message} />
                <Input label="Phone" type="tel" placeholder="Phone" {...register("phone", { required: "Required", pattern: { value: /^[0-9]{10}$/, message: "10 digits required" } })} error={errors.phone?.message} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="syne-bold text-lg">Addresses</h3><button type="button" onClick={addAddress} className="text-sm font-black text-[#28543d] hover:underline">+ Add New</button></div>
                  {addresses.map((addr, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4 relative">
                      {addresses.length > 1 && <button type="button" onClick={() => removeAddress(idx)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition-colors"><X className="w-4 h-4" /></button>}
                      <Input label="Residency Address *" value={addr.residencyAddress} onChange={(e) => updateAddressField(idx, "residencyAddress", e.target.value)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Landmark (Optional)" value={addr.landmark} onChange={(e) => updateAddressField(idx, "landmark", e.target.value)} />
                        <Input label="Street / Area *" value={addr.street} onChange={(e) => updateAddressField(idx, "street", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <Input label="Pincode *" value={addr.pincode} onChange={(e) => updateAddressField(idx, "pincode", e.target.value)} />
                        <Input label="City *" value={addr.city} onChange={(e) => updateAddressField(idx, "city", e.target.value)} />
                        <Input label="State *" value={addr.state} onChange={(e) => updateAddressField(idx, "state", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-8">
                  <Button type="submit" className="w-full bg-[#744531] text-white rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-[#28543d] transition-all" disabled={saving}>
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : "Apply Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email Confirm Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-black" onClick={() => setIsPasswordModalOpen(false)}><X className="w-6 h-6" /></button>
            <h2 className="syne-bold text-2xl mb-4">Confirm Email</h2>
            <p className="text-gray-500 mb-6 font-medium">Please enter your password to change email to <span className="text-[#744531] font-bold">{pendingEmail}</span></p>
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="flex-1 rounded-2xl py-4 text-gray-600" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 rounded-2xl py-4 bg-[#744531] text-white hover:bg-[#28543d]" onClick={handleConfirmEmailUpdate} disabled={saving}>{saving ? "Updating..." : "Confirm"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: OrderCard
function OrderCard({ order, formatINR, safeJSONParse, normalizeStatus, onCancel }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsedItems = safeJSONParse(order.items, []);
  const itemsList = Array.isArray(parsedItems) ? parsedItems : (Array.isArray(parsedItems?.items) ? parsedItems.items : []);
  const shippingAddr = safeJSONParse(order.shippingAddress, null);
  const fulfillmentStatus = order.fulfillmentStatus || order.fulfillmentSattus || "pending";

  const getStatusBadge = (status) => {
    const s = normalizeStatus(status || fulfillmentStatus);
    const config = {
      delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
      shipped: "bg-blue-50 text-blue-600 border-blue-100",
      cancelled: "bg-red-50 text-red-600 border-red-100",
      processing: "bg-amber-50 text-amber-600 border-amber-100",
      pending: "bg-orange-50 text-orange-600 border-orange-100",
    }[s] || "bg-gray-50 text-gray-600 border-gray-100";

    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config}`}>{s}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E7CE9D]/10 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3"><h4 className="syne-bold text-[#201413]">Order #{order.$id.slice(-6).toUpperCase()}</h4>{getStatusBadge(fulfillmentStatus)}</div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(order.$createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div><p className="text-[10px] font-black uppercase text-gray-400">Total Paid</p><p className="syne-bold text-2xl text-[#28543d]">{formatINR(order.total_cents)}</p></div>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`w-10 h-10 bg-[#faf8f4] flex items-center justify-center rounded-xl text-[#744531] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-6 border-t border-gray-50 space-y-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Status</p><p className="font-bold text-[#201413] tracking-wide uppercase">{order.paymentStatus || "Paid"}</p></div>
                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Method</p><p className="font-bold text-[#201413] tracking-wide uppercase">{order.paymentMode || "COD"}</p></div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-gray-400">Order Items</p>
                {itemsList.map((item, id) => (
                  <div key={id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                    <div><span className="font-bold text-[#201413]">{item.n || item.name}</span><span className="ml-2 text-xs text-[#744531]">({item.q ?? item.qty}x)</span></div>
                    <p className="font-black text-[#28543d]">{formatINR(item.t ?? item.item_total_cents)}</p>
                  </div>
                ))}
              </div>
              {shippingAddr && (
                <div className="p-5 bg-green-50/30 rounded-[1.5rem] border border-green-100 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#28543d] mt-1" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#28543d] tracking-widest mb-1">Shipping To</p>
                    <p className="text-sm font-bold text-[#201413] leading-tight">
                      {shippingAddr.ra || shippingAddr.residencyAddress}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {shippingAddr.st || shippingAddr.street}, {shippingAddr.ct || shippingAddr.city} {shippingAddr.pc || shippingAddr.pincode}
                    </p>
                  </div>
                </div>
              )}
              {order.shipment_number && (
                <div className="p-5 bg-blue-50/30 rounded-[1.5rem] border border-blue-100 flex items-start gap-3">
                  <div className="w-4 h-4 text-blue-600 mt-1"><Package size={16} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Shipment Number</p>
                    <p className="text-sm font-bold text-[#201413] leading-tight">{order.shipment_number}</p>
                  </div>
                </div>
              )}
              {normalizeStatus(fulfillmentStatus) === "pending" && (
                <div className="space-y-3 pt-2">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Want to cancel this order?</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const reason = window.prompt("Please provide a reason for cancellation (Optional):");
                        if (reason !== null) onCancel(order.$id, reason);
                      }}
                      className="w-full py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors border-2 border-red-50 rounded-2xl bg-red-50/30"
                    >
                      Cancel with Reason
                    </button>
                    <a
                      href={`https://wa.me/919082716034?text=${encodeURIComponent(`Hello, I would like to cancel my order #${order.$id.slice(-6).toUpperCase()}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 text-xs font-black uppercase tracking-widest text-green-600 hover:text-green-700 transition-colors border-2 border-green-50 rounded-2xl bg-green-50/30 text-center"
                    >
                      Cancel via WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Profile;
