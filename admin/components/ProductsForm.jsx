import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label, Textarea, Select } from "../components";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { useSelector } from "react-redux";

function getFriendlyErrorMessage(error) {
  if (!error) return "";
  if (error.code === 409 || /already exists|duplicate/i.test(error.message)) {
    return "A product with this name or slug already exists.";
  }
  if (error.code === 0 || /network|connection/i.test(error.message)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  if (/invalid/i.test(error.message)) {
    return "Invalid input. Please check your data.";
  }
  return "An unexpected error occurred. Please try again.";
}

export default function ProductsForm({ onSuccess }) {
  const [submitError, setSubmitError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch categories from Redux store
  const categories = useSelector((state) => state.categories.items);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      description: "",
      price_cents: "",
      stock: "",
      category: "",
    },
  });

  // Real-time slug update
  const nameValue = watch("name");
  useEffect(() => {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }, [nameValue, setValue]);

  // Image preview logic
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  // Form submission (Create Product only)
  const onSubmit = async (data) => {
    setSubmitError("");
    try {
      let imageFileId = null;
      // Upload image if file selected
      if (selectedFile) {
        const uploadRes = await appwriteService.uploadFile(selectedFile);
        if (!uploadRes || !uploadRes.$id) throw new Error("Image upload failed");
        imageFileId = uploadRes.$id;
      }
      // Prepare product data
      const productPayload = {
        slug: data.slug,
        name: data.name,
        description: data.description,
        price_cents: Math.round(Number(data.price_cents) * 100),
        image_file_ids: imageFileId ? imageFileId : "",
        stock: Number(data.stock),
        sku: data.sku,
        categories: data.category ? data.category : [],
      };
      // Create product only
      await appwriteService.createProduct(productPayload);
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-bold text-[#084629] mb-2">
        Add New Product
      </h2>

      {/* Image Upload */}
      <div>
        <Label htmlFor="image">Product Image</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSubmitting}
          wrapperClassName="!border-0 !bg-transparent"
        />
        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
            />
          </div>
        )}
      </div>

      {/* Name & Slug */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            placeholder="Product Name"
            disabled={isSubmitting}
            error={errors.name?.message}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...register("slug")}
            value={watch("slug")}
            disabled
            error={errors.slug?.message}
          />
        </div>
      </div>

      {/* SKU */}
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          {...register("sku")}
          placeholder="Stock Keeping Unit"
          disabled={isSubmitting}
          error={errors.sku?.message}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Product Description"
          disabled={isSubmitting}
          error={errors.description?.message}
        />
      </div>

      {/* Price & Stock */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="price_cents" required>
            Price (INR)
          </Label>
          <Input
            id="price_cents"
            type="number"
            min="0"
            step="0.01"
            {...register("price_cents", {
              required: "Price is required",
              min: { value: 0, message: "Price must be positive" },
            })}
            placeholder="e.g. 499.99"
            disabled={isSubmitting}
            error={errors.price_cents?.message}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="stock" required>
            Stock
          </Label>
          <Input
            id="stock"
            type="number"
            min="0"
            step="1"
            {...register("stock", {
              required: "Stock is required",
              min: { value: 0, message: "Stock must be positive" },
            })}
            placeholder="e.g. 100"
            disabled={isSubmitting}
            error={errors.stock?.message}
          />
        </div>
      </div>

      {/* Category Select */}
      <div>
        <Label htmlFor="category" required>
          Category
        </Label>
        <Select
          id="category"
          options={categories.map((cat) => ({
            value: cat.$id,
            label: cat.name,
            id: cat.$id,
          }))}
          value={watch("category")}
          onValueChange={(val) => setValue("category", val, { shouldValidate: true })}
          placeholder="Select Category"
          disabled={isSubmitting}
        />
        {errors.category && (
          <div className="text-red-600 text-sm font-medium mt-1">
            {errors.category.message}
          </div>
        )}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="text-red-600 text-sm font-medium">{submitError}</div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isSubmitting}
        className="w-full"
      >
        Add Product
      </Button>
    </form>
  );
}