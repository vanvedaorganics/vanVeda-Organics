import React, { useState } from "react";
import appwriteAuthService from "../appwrite/authService";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { Button, Input } from "../components";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

function ClientSignup() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();

  const create = async (data) => {
    setError("");
    setLoading(true);

    try {
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      const userData = await appwriteAuthService.createAccount(data);
      if (userData) {
        const user = await appwriteAuthService.getCurrentUser();
        if (user) dispatch(login(user));
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#fafafa] min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Logo */}

        {/* Title */}
        <h2 className="text-center text-3xl md:text-4xl font-bold text-[#2D1D1A]">
          Sign up to create account
        </h2>
        <p className="mt-2 text-center text-base text-[#613D38]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#69A72A] font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>

        {/* Error */}
        {error && (
          <p className="text-red-600 mt-6 text-center font-medium">{error}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(create)} className="space-y-6 mt-6">
          {/* Name */}
          <Input
            label="Name"
            placeholder="Enter your full name"
            {...register("name", { required: true })}
            disabled={loading}
          />

          {/* Username */}
          <Input
            label="Username"
            placeholder="Choose a username"
            {...register("username", { required: true })}
            disabled={loading}
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register("email", {
              required: true,
              validate: {
                matchPattern: (value) =>
                  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                  "Email address must be valid",
              },
            })}
            disabled={loading}
          />

          {/* Password */}
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("password", { required: true })}
            disabled={loading}
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

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register("confirmPassword", { required: true })}
            disabled={loading}
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            }
          />

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={loading}
            className="w-full rounded-xl bg-[#2D1D1A] text-white shadow-md hover:bg-[#2D1D1A]/90 hover:shadow-lg transition-all duration-300"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default ClientSignup;
