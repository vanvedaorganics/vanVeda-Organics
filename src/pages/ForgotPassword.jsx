import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Mail, CheckCircle } from "lucide-react";
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await appwriteAuthService.createPasswordRecovery(email);
      setSuccess(true);
    } catch (err) {
      console.error("[ForgotPassword] Error:", err);
      setError(err.message || "Failed to send recovery email. Please try again.");
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
                <h1 className="syne-bold text-3xl text-[#744531] mb-2">Reset Password</h1>
                <p className="text-gray-400 text-sm font-medium">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="hello@truesoil.com"
                  className="rounded-2xl border-[#E7CE9D]/40 focus:ring-[#28543d] focus:border-[#28543d]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  prefix={<Mail className="w-4 h-4 text-gray-400 mr-2" />}
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
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-[#28543d] transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send Recovery Link
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
              <h2 className="syne-bold text-2xl text-[#744531] mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm font-medium mb-8">
                We've sent a password reset link to <span className="text-[#744531] font-bold">{email}</span>. 
                Please check your inbox and follow the instructions.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full h-12 rounded-xl border-[#E7CE9D]/40 text-[#744531] hover:bg-[#faf8f4]">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm font-medium">
              Remember your password?{" "}
              <Link to="/login" className="text-[#28543d] font-bold hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
