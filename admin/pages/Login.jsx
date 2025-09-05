import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Eye, EyeOff } from "lucide-react"; // 👈 add icons
// import Input from "../components/Input";
// import Button from "../components/Button";
import { Button, Input } from '../components';
import authService from "../../src/appwrite/authService";
import { login } from "../../src/store/authSlice";

export default function Login() {
  const dispatch = useDispatch();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await authService.login({ email, password });
      const user = await authService.getUser();

      const isAdmin = await authService.isAdmin();
      if (!isAdmin) {
        await authService.logout();
        throw new Error("You are not authorized to access the Admin Panel.");
      }

      dispatch(login({ user, session }));
      console.log("[Login] Success:", user);
    } catch (err) {
      console.error("[Login] Error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#084629] mb-6 text-center">
          Admin Login
        </h1>

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
                tabIndex={-1} // don’t steal tab focus from input
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

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
