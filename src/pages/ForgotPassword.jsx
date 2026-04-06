import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";
import { Link } from "react-router-dom";
import conf from "../conf/conf";

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
      const baseUrl = conf.appBaseUrl.endsWith("/")
        ? conf.appBaseUrl.slice(0, -1)
        : conf.appBaseUrl;
      const url = `${baseUrl}/reset-password`;
      await appwriteAuthService.createRecovery(email, url);
      setSuccess(true);
    } catch (err) {
      console.error("[ForgotPassword] Error:", err);
      setError(err.message || "Failed to send recovery email.");
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
                <div className="mb-8">
                  <h1 className="syne-bold text-3xl text-[#744531] mb-2 text-center">Forgot Password?</h1>
                  <p className="text-gray-400 text-sm font-medium text-center px-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
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
                        Send Reset Link
                        <Mail className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-[#28543d] font-bold text-sm hover:underline transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
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
                <h2 className="syne-bold text-2xl text-[#744531] mb-2">Check Your Email</h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  We've sent a password reset link to <br />
                  <span className="font-bold text-[#28543d]">{email}</span>
                </p>
                <p className="text-xs text-gray-400 mb-8 italic">
                  Don't forget to check your spam folder if you don't see it in a few minutes.
                </p>
                <Link to="/login">
                  <Button className="w-full h-14 rounded-2xl bg-[#744531] text-white font-black text-sm uppercase tracking-widest">
                    Return to Login
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
