import React, { useState } from "react";
import appwriteAuthService from "../appwrite/authService";
import appwriteConfigService from "../appwrite/appwriteConfigService";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../store/authSlice";
import { Button, Input } from "../components";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { fetchCart } from "../store/cartsSlice"; // fetch cart after signup

function ClientSignup() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, reset } = useForm();

  const create = async (data) => {
    setError("");
    setLoading(true);

    try {
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      // 1️⃣ Create account
      await appwriteAuthService.createAccount({
        email: data.email,
        password: data.password,
        name: data.username,
      });

      // 2️⃣ Login after signup
      await appwriteAuthService.login({
        email: data.email,
        password: data.password,
      });

      // 3️⃣ Get current user
      const user = await appwriteAuthService.getUser();

      if (!user) throw new Error("Unable to get user after signup.");

      // 4️⃣ Prepare address object
      const addressObj = {
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        street: data.street,
        landmark: data.landmark || "",
      };
      const addressArray = [JSON.stringify(addressObj)]; // Appwrite expects array<string>

      // 5️⃣ Create user profile
      await appwriteConfigService.createUserProfile({
        user_id: user.$id,
        displayName: data.username,
        phone: data.phone,
        email: data.email,
        address: addressArray,
      });

      // 6️⃣ Create empty cart
      await appwriteConfigService.createCart({ user_id: user.$id, items: {} });

      // 7️⃣ Dispatch login
      dispatch(login(user));

      // 8️⃣ Fetch cart immediately
      try {
        await dispatch(fetchCart()).unwrap();
      } catch (cartErr) {
        console.error("Failed to fetch cart:", cartErr);
        setError("Account created, but failed to fetch cart.");
      }

      // 9️⃣ Reset form & navigate
      reset();
      navigate("/");
    } catch (err) {
      console.error("[Signup] Error:", err);
      setError(err.message || "Something went wrong during signup.");
    } finally {
      setLoading(false); // spinner stops only after all tasks complete
    }
  };

  return (
    <div className="w-full bg-[#fafafa] min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
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

          {/* Phone */}
          <Input
            label="Phone"
            type="tel"
            placeholder="Enter your mobile number"
            {...register("phone", { required: true })}
            disabled={loading}
          />

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State"
              placeholder="Enter state"
              {...register("state", { required: true })}
              disabled={loading}
            />
            <Input
              label="City"
              placeholder="Enter city"
              {...register("city", { required: true })}
              disabled={loading}
            />
            <Input
              label="Pincode"
              placeholder="Enter pincode"
              {...register("pincode", { required: true })}
              disabled={loading}
            />
            <Input
              label="Street"
              placeholder="Street / Area"
              {...register("street", { required: true })}
              disabled={loading}
            />
            <Input
              label="Landmark (Optional)"
              placeholder="Near park, mall..."
              {...register("landmark")}
              disabled={loading}
            />
          </div>

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
