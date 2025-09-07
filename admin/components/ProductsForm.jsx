// src/components/ProductsForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label, Textarea, Select } from "../components";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { useSelector } from "react-redux";

// Friendly error messages for UX
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

export default function ProductsForm({ onSuccess, initialData = null }) {
  const isEdit = !!initialData;

  const [submitError, setSubmitError] = useState("");
  const [imagePreview, setImagePreview] = useState(
    initialData?.image_file_ids
      ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${initialData.image_file_ids}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
      : null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [prevFileId, setPrevFileId] = useState(initialData?.image_file_ids || null);

  // track object URLs we created so we can revoke them
  const objectUrlRef = useRef(null);

  // Redux categories
  const categories = useSelector((state) => state.categories.items);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      price_cents: initialData?.price_cents ? (initialData.price_cents / 100).toString() : "",
      stock: initialData?.stock || "",
      // category should be a single ID when editing: either initialData.categories (ID) or expanded object
      category:
        initialData?.categories?.$id ?? // if appwrite returned expanded relation
        (typeof initialData?.categories === "string" ? initialData.categories : "") ??
        "",
    },
  });

  // Auto-generate slug if adding
  const nameValue = watch("name");
  useEffect(() => {
    if (!isEdit) {
      const slug = (nameValue || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", slug, { shouldValidate: true });
    }
  }, [nameValue, setValue, isEdit]);

  // Reset when editing (pre-fill, including category as ID)
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        sku: initialData.sku || "",
        description: initialData.description || "",
        price_cents: initialData.price_cents ? (initialData.price_cents / 100).toString() : "",
        stock: initialData.stock || "",
        category:
          initialData?.categories?.$id ?? // expanded relation
          (typeof initialData?.categories === "string" ? initialData.categories : "") ??
          "",
      });

      setImagePreview(
        initialData.image_file_ids
          ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${initialData.image_file_ids}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
          : null
      );
      setPrevFileId(initialData.image_file_ids || null);
      setSelectedFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEdit, reset]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Image preview handling (local state only, NOT registered with react-hook-form)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;

    // revoke previous object URL if we created one
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setSelectedFile(file);

    if (file) {
      const objUrl = URL.createObjectURL(file);
      objectUrlRef.current = objUrl;
      setImagePreview(objUrl);
      // clear any previous image errors
      clearErrors("image");
      setSubmitError("");
    } else {
      // if user cleared input, revert to previous image (if any) or null
      setImagePreview(
        prevFileId
          ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${prevFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
          : null
      );
    }
  };

  // Submit
  const onSubmit = async (data) => {
    setSubmitError("");
    // client-side validations for image presence:
    if (!isEdit && !selectedFile && !prevFileId) {
      // new product requires image
      setError("image", { type: "required", message: "Image is required for new products" });
      return;
    }
    if (isEdit && !prevFileId && !selectedFile) {
      // editing a product that currently has no image -> image required
      setError("image", { type: "required", message: "Image is required (no existing image)" });
      return;
    }

    try {
      let imageFileId = prevFileId;

      if (selectedFile) {
        // if editing and previous exists, attempt delete (best-effort)
        if (isEdit && prevFileId) {
          try {
            await appwriteService.deleteFile(prevFileId);
          } catch (err) {
            // don't block - just warn
            console.warn("Could not delete previous file:", err);
          }
        }
        const uploadRes = await appwriteService.uploadFile(selectedFile);
        if (!uploadRes || !uploadRes.$id) throw new Error("Image upload failed");
        imageFileId = uploadRes.$id;
      }

      const productPayload = {
        slug: data.slug,
        name: data.name,
        description: data.description,
        price_cents: Math.round(Number(data.price_cents) * 100),
        image_file_ids: imageFileId || "",
        stock: Number(data.stock),
        sku: data.sku,
        categories: data.category || null, // single ID
      };

      if (isEdit) {
        await appwriteService.updateProduct(data.slug, productPayload);
      } else {
        await appwriteService.createProduct(productPayload);
      }

      // cleanup object URL created for preview
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      // reset local file state
      setSelectedFile(null);
      setPrevFileId(imageFileId || null);
      setImagePreview(
        imageFileId
          ? `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${imageFileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`
          : null
      );

      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-bold text-[#084629] mb-2">
        {isEdit ? "Edit Product" : "Add New Product"}
      </h2>

      {/* Image Upload — NOT registered with react-hook-form */}
      <div>
        <Label htmlFor="image" required={!isEdit || !prevFileId}>
          Product Image
        </Label>

        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange} // our local handler
          disabled={isSubmitting}
          wrapperClassName="!border-0 !bg-transparent"
        />

        {errors.image && <div className="text-red-600 text-sm mt-1">{errors.image.message}</div>}

        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded border" />
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
          <Input id="slug" {...register("slug")} value={watch("slug")} disabled error={errors.slug?.message} />
        </div>
      </div>

      {/* SKU */}
      <div>
        <Label htmlFor="sku" required>
          SKU
        </Label>
        <Input id="sku" {...register("sku", { required: "SKU is required" })} placeholder="Stock Keeping Unit" disabled={isSubmitting} error={errors.sku?.message} />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" required>
          Description
        </Label>
        <Textarea id="description" {...register("description", { required: "Description is required" })} placeholder="Product Description" disabled={isSubmitting} error={errors.description?.message} />
      </div>

      {/* Price & Stock */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="price_cents" required>
            Price (INR)
          </Label>
          <Input id="price_cents" type="number" min="0" step="0.01" {...register("price_cents", { required: "Price is required", min: { value: 0, message: "Price must be positive" } })} placeholder="e.g. 499.99" disabled={isSubmitting} error={errors.price_cents?.message} />
        </div>
        <div className="flex-1">
          <Label htmlFor="stock" required>
            Stock
          </Label>
          <Input id="stock" type="number" min="0" step="1" {...register("stock", { required: "Stock is required", min: { value: 0, message: "Stock must be positive" } })} placeholder="e.g. 100" disabled={isSubmitting} error={errors.stock?.message} />
        </div>
      </div>

      {/* Category Select */}
      <div>
        <Label htmlFor="category" required>
          Category
        </Label>
        <Select
          id="category"
          options={categories.map((cat) => ({ value: cat.$id, label: cat.name }))}
          value={watch("category")}
          onValueChange={(val) => {
            setValue("category", val, { shouldValidate: true });
            clearErrors("category");
          }}
          placeholder="Select Category"
          disabled={isSubmitting}
        />
        {errors.category && <div className="text-red-600 text-sm font-medium mt-1">{errors.category.message}</div>}
      </div>

      {/* Submit / Error */}
      {submitError && <div className="text-red-600 text-sm font-medium">{submitError}</div>}

      <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
        {isEdit ? "Update Product" : "Add Product"}
      </Button>
    </form>
  );
}
