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
      // 1️⃣ Password check
      if (data.password !== data.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      // 2️⃣ Create account (Appwrite will auto-create session)
      const account = await appwriteAuthService.createAccount({
        email: data.email,
        password: data.password,
        name: data.username,
      });
      if (!account) throw new Error("Account creation failed.");

      const session = await appwriteAuthService.login({
        email: data.email,
        password: data.password,
      });
      if (!session) throw new Error("Login after signup failed.");

      // 3️⃣ Get current user (session already active from signup)
      const user = await appwriteAuthService.getUser();
      if (!user) throw new Error("Unable to get user after signup.");

      // 4️⃣ Prepare address object
      const addressObj = {
        residencyAddress: data.residencyAddress,
        landmark: data.landmark || "",
        street: data.street,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
      };
      const addressArray = [JSON.stringify(addressObj)];

      // 5️⃣ Create user profile
      const profile = await appwriteConfigService.createUserProfile({
        user_id: user.$id,
        displayName: data.username,
        phone: data.phone,
        email: data.email,
        address: addressArray,
      });
      if (!profile) throw new Error("User profile creation failed.");

      // 6️⃣ Create empty cart
      const cart = await appwriteConfigService.createCart({
        user_id: user.$id,
        items: {},
      });
      if (!cart) throw new Error("Cart creation failed.");

      // 7️⃣ Dispatch login
      dispatch(login(user));

      // 8️⃣ Fetch cart immediately (strict dependency)
      const fetchedCart = await dispatch(fetchCart()).unwrap();
      if (!fetchedCart) throw new Error("Cart fetch failed.");

      // 9️⃣ Reset form & navigate
      reset();
      navigate("/");
    } catch (err) {
      console.error("[Signup] Error:", err);
      setError(err.message || "Something went wrong during signup.");
    } finally {
      setLoading(false);
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
          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Residency Address"
              placeholder="Flat / Building / Residency"
              {...register("residencyAddress", { required: true })}
              disabled={loading}
            />
            <Input
              label="Landmark (Optional)"
              placeholder="Near park, mall..."
              {...register("landmark")}
              disabled={loading}
            />
            <Input
              label="Street"
              placeholder="Street / Area"
              {...register("street", { required: true })}
              disabled={loading}
            />
            <Input
              label="Pincode"
              placeholder="Enter pincode"
              {...register("pincode", { required: true })}
              disabled={loading}
            />
            <Input
              label="City"
              placeholder="Enter city"
              {...register("city", { required: true })}
              disabled={loading}
            />
            <Input
              label="State"
              placeholder="Enter state"
              {...register("state", { required: true })}
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
