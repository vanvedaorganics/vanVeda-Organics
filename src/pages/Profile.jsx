import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import appwriteAuthService from "../appwrite/authService";
import { Button, Input } from "../components";
import { User, Phone, Mail, MapPin, X } from "lucide-react";
import { useForm } from "react-hook-form";

function Profile() {
  const authUser = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");

  const [pendingEmail, setPendingEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch Profile
  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await appwriteConfigService.getUserProfile(authUser.$id);

        let parsedAddress = [];
        if (Array.isArray(res.address) && res.address.length > 0) {
          parsedAddress = res.address
            .map((addr) => {
              try {
                return JSON.parse(addr);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        }

        setProfile({ ...res, parsedAddress });
        setAddresses(parsedAddress);
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
      let isChanged = false;
      const addressArray = addresses.map((addr) => JSON.stringify(addr));

      // Handle email update separately → ask password first
      if (data.email !== profile.email) {
        setPendingEmail(data.email);
        setIsPasswordModalOpen(true);
        setSaving(false);
        return;
      }

      // Update name in Auth + Profile
      if (data.displayName !== profile.displayName) {
        await appwriteAuthService.updateName({ name: data.displayName });
      }

      // Update profile collection
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
        let parsedAddress = updated.address?.map((addr) => JSON.parse(addr));
        setProfile({ ...updated, parsedAddress });
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
      let parsedAddress = updated.address?.map((addr) => JSON.parse(addr));
      setProfile({ ...updated, parsedAddress });

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
        Profile not found
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-lg p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#2D1D1A] text-white shadow-md">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#201413]">
              {profile.displayName}
            </h1>
            <p className="text-[#613D38]">User Profile</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && <div className="p-3 rounded-lg bg-red-100 text-red-700">{error}</div>}

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

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button
            size="lg"
            className="flex-1 rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg"
            onClick={openModal}
          >
            Edit Profile
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 rounded-xl border-[#2D1D1A] text-[#2D1D1A] hover:bg-gray-100"
            onClick={() => navigate("/orders")}
          >
            View Orders
          </Button>
        </div>
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your phone number"
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
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <Input
                        label="Residency Address"
                        value={addr.residencyAddress}
                        onChange={(e) => updateAddressField(idx, "residencyAddress", e.target.value)}
                      />
                      <Input
                        label="Landmark"
                        value={addr.landmark}
                        onChange={(e) => updateAddressField(idx, "landmark", e.target.value)}
                      />
                      <Input
                        label="Street"
                        value={addr.street}
                        onChange={(e) => updateAddressField(idx, "street", e.target.value)}
                      />
                      <Input
                        label="Pincode"
                        value={addr.pincode}
                        onChange={(e) => updateAddressField(idx, "pincode", e.target.value)}
                      />
                      <Input
                        label="City"
                        value={addr.city}
                        onChange={(e) => updateAddressField(idx, "city", e.target.value)}
                      />
                      <Input
                        label="State"
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

export default Profile;
