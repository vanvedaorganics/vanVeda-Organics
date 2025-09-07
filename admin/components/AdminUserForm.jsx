import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label, Select } from "../components";
import authService from "../../src/appwrite/authService";
import { Eye, EyeOff } from "lucide-react"; // <-- Add icons

const roles = [
  { value: "admin", label: "Admin", id: "admin" },
  { value: "manager", label: "Manager", id: "manager" },
  { value: "editor", label: "Editor", id: "editor" },
];

function getFriendlyErrorMessage(error) {
  if (!error) return "";
  if (/already exists|duplicate|used/i.test(error.message)) {
    return "A user with this email already exists.";
  }
  if (/network|connection/i.test(error.message)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  if (/invalid/i.test(error.message)) {
    return "Invalid input. Please check your data.";
  }
  return typeof error === "string"
    ? error
    : "An unexpected error occurred. Please try again.";
}

export default function AdminUserForm({ onSuccess }) {
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    },
  });

  const onSubmit = async (data) => {
    setSubmitError("");
    setLoading(true);
    try {
      if (data.password !== data.confirmPassword) {
        setSubmitError("Passwords do not match.");
        setLoading(false);
        return;
      }
      // 1) Create user account
      const createRes = await authService.createAccount({
        email: data.email,
        password: data.password,
        name: data.username,
      });
      if (
        typeof createRes === "string" &&
        createRes.startsWith("Appwrite Error")
      ) {
        throw new Error(createRes);
      }
      // // 2) Subscribe user to team with selected role
      // await authService.createTeamMembership({
      //   roles: [data.role],
      //   userId: createRes.$id,
      // });
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-bold text-[#084629] mb-2">
        Add New Admin User
      </h2>
      <div>
        <Label htmlFor="username" required>
          Username
        </Label>
        <Input
          id="username"
          {...register("username", { required: "Username is required" })}
          placeholder="Enter username"
          disabled={loading}
          error={errors.username?.message}
        />
      </div>
      <div>
        <Label htmlFor="email" required>
          Email ID
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email address",
            },
          })}
          placeholder="Enter email"
          disabled={loading}
          error={errors.email?.message}
        />
      </div>
      <div>
        <Label htmlFor="password" required>
          Password
        </Label>
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
          placeholder="Enter password"
          disabled={loading}
          error={errors.password?.message}
          suffix={
            <button
              type="button"
              tabIndex={-1}
              className="focus:outline-none"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-500" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500" />
              )}
            </button>
          }
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword" required>
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type={showConfirm ? "text" : "password"}
          {...register("confirmPassword", {
            required: "Please confirm your password",
          })}
          placeholder="Confirm password"
          disabled={loading}
          error={errors.confirmPassword?.message}
          suffix={
            <button
              type="button"
              tabIndex={-1}
              className="focus:outline-none"
              onClick={() => setShowConfirm((prev) => !prev)}
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5 text-gray-500" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500" />
              )}
            </button>
          }
        />
      </div>
      <div>
        <Label htmlFor="role" required>
          User Role
        </Label>
        <Select
          id="role"
          options={roles}
          value={watch("role")}
          onValueChange={(val) =>
            setValue("role", val, { shouldValidate: true })
          }
          placeholder="Select Role"
          disabled={loading}
        />
        {errors.role && (
          <div className="text-red-600 text-sm font-medium mt-1">
            {errors.role.message}
          </div>
        )}
      </div>
      {submitError && (
        <div className="text-red-600 text-sm font-medium">{submitError}</div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        className="w-full"
      >
        Add User
      </Button>
    </form>
  );
}
