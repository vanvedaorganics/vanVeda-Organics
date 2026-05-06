import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";
import { login } from "../store/authSlice";
import { fetchCart } from "../store/cartsSlice";
import { fetchUsers } from "../store/usersSlice";

export default function ClientLogin() {
  const dispatch = useDispatch();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Login
      const session = await appwriteAuthService.login({ email, password });

      // 2️⃣ Get current user
      const user = await appwriteAuthService.getUser();

      // 3️⃣ Dispatch login to Redux
      dispatch(login({ user, session }));

      // 4️⃣ Hydrate users slice ONLY after successful login
      try {
        await dispatch(fetchUsers()).unwrap();
      } catch (uErr) {
        console.error("[ClientLogin] Users hydration failed:", uErr);
      }

      // 5️⃣ Fetch user's cart
      try {
        await dispatch(fetchCart()).unwrap();
      } catch (cartErr) {
        console.error("Failed to fetch cart:", cartErr);
        setError("Logged in but failed to fetch cart.");
      }

    } catch (err) {
      console.error("[ClientLogin] Error:", err);
      setError(err.message || "Login failed. Please try again.");
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
            src="/SignIn.jpeg"
            alt="Organic Lifestyle"
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
                Purely Organic,<br />Truly Soulful.
              </h2>
              <p className="text-[#E7CE9D] text-lg font-medium tracking-wide">
                Experience the essence of nature in every drop.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Right Side: Auth Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#faf8f4]">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Back button or Brand logo if needed */}
          <div className="mb-12 flex justify-center lg:justify-start">
            <a href="/" className="transition-transform hover:scale-105 duration-300">
               <img src="/Truesoil.png" alt="TrueSoil" className="h-16 w-auto" />
            </a>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(40,84,61,0.08)] p-8 md:p-10 border border-[#E7CE9D]/20">
            <div className="mb-8">
              <h1 className="syne-bold text-3xl text-[#744531] mb-2">Welcome Back</h1>
              <p className="text-gray-400 text-sm font-medium">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                name="email"
                type="email"
                label="Email Address"
                placeholder="hello@vanveda.com"
                className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />

              <div className="space-y-1">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
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
                <div className="flex justify-end pr-1">
                  <Link to="/forgot-password"  className="text-[10px] uppercase tracking-widest font-bold text-[#28543d] hover:text-[#744531] transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-red-50 text-[11px] font-bold text-red-600 rounded-xl border border-red-100 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#28543d] transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-400 text-sm font-medium">
                Don’t have an account?{" "}
                <a href="/signup" className="text-[#28543d] font-bold hover:underline transition-all">
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
