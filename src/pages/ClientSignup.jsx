import React, { useState, useEffect } from "react";
import appwriteAuthService from "../appwrite/authService";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { Button, Input } from "../components";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { fetchCart } from "../store/cartsSlice";

function ClientSignup() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const password = watch("password");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const create = async (data) => {
    setError("");
    setLoading(true);
    let createdUserId = null;
    let isProfileCreated = false;
    let isCartCreated = false;

    try {
      // 1. Create Account
      const account = await appwriteAuthService.createAccount({
        email: data.email,
        password: data.password,
        name: data.username,
      });
      if (!account) throw new Error("Account creation failed.");
      createdUserId = account.$id;

      // 2. Login to get session (required for some operations)
      const session = await appwriteAuthService.login({
        email: data.email,
        password: data.password,
      });
      if (!session) throw new Error("Login after signup failed.");

      const user = await appwriteAuthService.getUser();
      if (!user) throw new Error("Unable to get user after signup.");

      // 3. Create Profile
      const addressObj = {
        residencyAddress: data.residencyAddress,
        landmark: data.landmark || "",
        street: data.street,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
      };
      
      const profile = await appwriteConfigService.createUserProfile({
        user_id: user.$id,
        displayName: data.username,
        phone: data.phone,
        email: data.email,
        address: [JSON.stringify(addressObj)],
      });
      if (!profile) throw new Error("User profile creation failed.");
      isProfileCreated = true;

      // 4. Create Cart
      const cart = await appwriteConfigService.createCart({
        user_id: user.$id,
        items: {},
      });
      if (!cart) throw new Error("Cart creation failed.");
      isCartCreated = true;

      // 5. Finalize
      dispatch(login(user));
      await dispatch(fetchCart()).unwrap();

      reset();
      navigate("/");
    } catch (err) {
      console.error("[Signup] Error:", err);
      setError(err.message || "Something went wrong during signup.");

      // ROLLBACK SAFETY
      try {
        if (createdUserId) {
          console.log("[Rollback] Cleaning up resources for user:", createdUserId);
          if (isCartCreated) await appwriteConfigService.deleteCart(createdUserId);
          if (isProfileCreated) await appwriteConfigService.deleteUserProfile(createdUserId);
          
          // Delete account last (requires active session, which we have if login succeeded)
          await appwriteAuthService.deleteAccount();
          console.log("[Rollback] Cleanup successful.");
        }
      } catch (rollbackErr) {
        console.error("[Rollback] Critical failure during cleanup:", rollbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex overflow-hidden font-sans">
      {/* ── Left Side: Lifestyle Image (Desktop only) ────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="/SignUp.jpeg"
            alt="Organic Lifestyle Signup"
            className="w-full h-full object-cover"
          />
          {/* Brand Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex flex-col justify-end p-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-4"
            >
              <h2 className="syne-bold text-5xl text-white leading-tight">
                Join Our<br />Organic Family.
              </h2>
              <p className="text-[#E7CE9D] text-lg font-medium tracking-wide">
                Start your journey towards a more natural lifestyle today.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Right Side: Auth Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#faf8f4] overflow-y-auto">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl py-12"
        >
          {/* Logo */}
          <div className="mb-12 flex justify-center lg:justify-start">
            <a href="/" className="transition-transform hover:scale-105 duration-300">
               <img src="/Truesoil.png" alt="TrueSoil" className="h-16 w-auto" />
            </a>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(40,84,61,0.08)] p-8 md:p-10 border border-[#E7CE9D]/20">
            <div className="mb-8">
              <h2 className="syne-bold text-3xl text-[#744531] mb-2">Create Account</h2>
              <p className="text-gray-400 text-sm font-medium">Join us for exclusive organic benefits.</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-3 bg-red-50 text-[11px] font-bold text-red-600 rounded-xl border border-red-100 flex items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(create)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Username"
                  placeholder="John Doe"
                  className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                  error={errors.username?.message}
                  {...register("username", { 
                    required: "Username is required",
                    minLength: { value: 3, message: "Minimum 3 characters" }
                  })}
                  disabled={loading}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="9876543210"
                  className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                  error={errors.phone?.message}
                  {...register("phone", { 
                    required: "Phone number is required",
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Must be exactly 10 digits"
                    }
                  })}
                  disabled={loading}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="hello@vanveda.com"
                className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Invalid email address"
                  }
                })}
                disabled={loading}
              />

              <div className="pt-2">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#E7CE9D] mb-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[#E7CE9D]/20"></span>
                  Shipping Address
                  <span className="h-px flex-1 bg-[#E7CE9D]/20"></span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Building / Flat"
                    placeholder="Residency details"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.residencyAddress?.message}
                    {...register("residencyAddress", { required: "Address is required" })}
                    disabled={loading}
                  />
                  <Input
                    label="Landmark (Optional)"
                    placeholder="Near park, mall..."
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    {...register("landmark")}
                    disabled={loading}
                  />
                  <Input
                    label="Street / Area"
                    placeholder="Street name"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.street?.message}
                    {...register("street", { required: "Street is required" })}
                    disabled={loading}
                  />
                  <Input
                    label="Pincode"
                    placeholder="110001"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.pincode?.message}
                    {...register("pincode", { 
                      required: "Pincode is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Must be 6 digits"
                      }
                    })}
                    disabled={loading}
                  />
                  <Input
                    label="City"
                    placeholder="Select City"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.city?.message}
                    {...register("city", { required: "City is required" })}
                    disabled={loading}
                  />
                  <Input
                    label="State"
                    placeholder="Select State"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.state?.message}
                    {...register("state", { required: "State is required" })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#E7CE9D] mb-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[#E7CE9D]/20"></span>
                  Security
                  <span className="h-px flex-1 bg-[#E7CE9D]/20"></span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.password?.message}
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 8, message: "Minimum 8 characters" }
                    })}
                    disabled={loading}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword", { 
                      required: "Please confirm your password",
                      validate: (val) => val === password || "Passwords do not match"
                    })}
                    disabled={loading}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#28543d] transition-all duration-300 flex items-center justify-center gap-2 group mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-400 text-sm font-medium">
                Already have an account?{" "}
                <Link to="/login" className="text-[#28543d] font-bold hover:underline transition-all">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ClientSignup;
