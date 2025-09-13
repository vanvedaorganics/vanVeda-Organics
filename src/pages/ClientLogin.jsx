import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Added Loader2 icon
import { Button, Input } from "../components";
import appwriteAuthService from "../appwrite/authService";
import { login } from "../store/authSlice";

export default function ClientLogin() {
  const dispatch = useDispatch();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await appwriteAuthService.login({ email, password });
      const user = await appwriteAuthService.getUser();

      dispatch(login({ user, session }));
      console.log("[ClientLogin] Success:", user);
    } catch (err) {
      console.error("[ClientLogin] Error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#fafafa] min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Title */}
        <h1 className="syne-bold text-3xl md:text-4xl text-[#2D1D1A] text-center mb-8">
          Login
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          {/* Password Input with Eye Toggle */}
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            }
          />

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          {/* Submit button with Loader */}
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {/* Extra actions */}
        <p className="text-center text-sm text-[#613D38] mt-6">
          Don’t have an account?{" "}
          <a href="/signup" className="text-[#69A72A] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
