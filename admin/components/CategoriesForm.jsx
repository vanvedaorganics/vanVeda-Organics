import React, {useState} from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label } from "../components";
import appwriteService from "../../src/appwrite/appwriteConfigService";

function getFriendlyErrorMessage(error) {
  if (!error) return "";
  // Appwrite duplicate entry error (code 409 or message includes 'already exists')
  if (error.code === 409 || /already exists|duplicate/i.test(error.message)) {
    return "A category with this name or slug already exists.";
  }
  // Network/connection error
  if (error.code === 0 || /network|connection/i.test(error.message)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  // Validation error
  if (/invalid/i.test(error.message)) {
    return "Invalid input. Please check your data.";
  }
  // Fallback
  return "An unexpected error occurred. Please try again.";
}

export default function CategoriesForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { name: "", slug: "" },
  });

 const [submitError, setSubmitError] = useState("");

  // Auto-generate slug from name
  const nameValue = watch("name");
  React.useEffect(() => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }, [nameValue, setValue]);

  const onSubmit = async (data) => {
    try {
      await appwriteService.createCategory({
        name: data.name,
        slug: data.slug,
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          placeholder="Category Name"
          disabled={isSubmitting}
          error={errors.name?.message}
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register("slug")}
          value={watch("slug")}
          disabled
          error={errors.slug?.message}
        />
      </div>
      {submitError && (
        <div className="text-red-600 text-sm font-medium">{submitError}</div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Adding..." : "Add Category"}
      </Button>
    </form>
  );
}