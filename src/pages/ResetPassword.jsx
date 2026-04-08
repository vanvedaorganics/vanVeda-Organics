import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    if (!userId || !secret) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [userId, secret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      await appwriteAuthService.updatePasswordRecovery(
        userId,
        secret,
        password,
        confirmPassword
      );
      setSuccess(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("[ResetPassword] Error:", err);
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[90vh] flex items-center justify-center p-6 sm:p-12 bg-[#faf8f4] font-sans">
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
          {!success ? (
            <>
              <div className="mb-8 text-center sm:text-left">
                <h1 className="syne-bold text-3xl text-[#744531] mb-2">New Password</h1>
                <p className="text-gray-400 text-sm font-medium">
                  Please enter and confirm your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  label="New Password"
                  placeholder="••••••••"
                  className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !!error && !userId}
                  required
                  prefix={<Lock className="w-4 h-4 text-gray-400 mr-2" />}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="focus:outline-none p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
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
                  disabled={loading || !!error && !userId}
                  required
                  prefix={<Lock className="w-4 h-4 text-gray-400 mr-2" />}
                />

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
                  disabled={loading || (!!error && !userId)}
                  className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#28543d] transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 bg-[#28543d]/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-[#28543d]" />
              </motion.div>
              <h2 className="syne-bold text-2xl text-[#744531] mb-2">Success!</h2>
              <p className="text-gray-400 text-sm font-medium mb-8">
                Your password has been reset successfully. Redirecting you to login...
              </p>
              <Link to="/login">
                <Button className="w-full h-12 rounded-xl bg-[#28543d] text-white">
                  Login Now
                </Button>
              </Link>
            </div>
          )}

          {!success && error && !userId && (
            <div className="mt-8 text-center">
               <Link to="/forgot-password">
                <Button variant="outline" className="w-full h-12 rounded-xl border-[#E7CE9D]/40 text-[#744531]">
                  Request New Link
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
