import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId || !secret) {
      setError("Invalid or expired reset link. Please try again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await appwriteAuthService.updateRecovery(userId, secret, password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      console.error("[ResetPassword] Error:", err);
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#faf8f4] flex items-center justify-center p-6 sm:p-12 font-sans">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Link to="/" className="transition-transform hover:scale-105 duration-300">
            <img src="/Truesoil.png" alt="TrueSoil" className="h-16 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(40,84,61,0.08)] p-8 md:p-10 border border-[#E7CE9D]/20">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="syne-bold text-3xl text-[#744531] mb-2">Set New Password</h1>
                  <p className="text-gray-400 text-sm font-medium px-4">
                    Please enter your new password below to reset your account access.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      label="New Password"
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

                    <Input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      label="Confirm New Password"
                      placeholder="••••••••"
                      className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
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
                        Reset Password
                        <ShieldCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="syne-bold text-2xl text-[#744531] mb-2">Password Reset Successful!</h2>
                <p className="text-gray-500 text-sm mb-10 leading-relaxed font-medium">
                  Your password has been successfully updated. You can now use your new password to sign in.
                </p>
                <Link to="/login" className="w-full">
                  <Button className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest">
                    Proceed to Sign In
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
