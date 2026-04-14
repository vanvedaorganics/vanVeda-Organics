import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label, Textarea, Select } from "../components";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { useSelector } from "react-redux";
import { getImageUrl } from "../../utils/getImageUrl";

// ---- Helpers ----
const genLocalId = () =>
  crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
const MAX_IMAGES_PER_SIZE = 4;

// NEW: Batch helpers
const pad2 = (n) => String(n).padStart(2, "0");

const toInputDate = (value) => {
  const val = String(value ?? "").trim();
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length !== 3) return "";
  const [a, b, c] = parts;
  if (a.length === 4) return `${a}-${pad2(b)}-${pad2(c)}`; // already yyyy-mm-dd
  if (c.length === 4) return `${c}-${pad2(b)}-${pad2(a)}`; // dd-mm-yyyy -> yyyy-mm-dd
  return "";
};

const toStoredDate = (value) => {
  const val = String(value ?? "").trim();
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length !== 3) return "";
  const [a, b, c] = parts;
  if (a.length === 4) return `${pad2(c)}-${pad2(b)}-${a}`; // yyyy-mm-dd -> dd-mm-yyyy
  if (c.length === 4) return `${pad2(a)}-${pad2(b)}-${c}`; // already dd-mm-yyyy
  return "";
};

const parseBatches = (raw) => {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((b) => ({
      id: genLocalId(),
      name: String(b?.name ?? "").trim(),
      delivery_date: toInputDate(b?.delivery_date),
    }))
    .filter((b) => b.name || b.delivery_date);
};

// New: helper to create a default empty packaging size row
const createEmptyPackagingSize = () => ({
  id: genLocalId(),
  size: "",
  priceRupees: "",
  images: [],
});

// Parse incoming packaging_size (array of strings or objects)
function parsePackagingSizes(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      let obj = item;
      if (typeof obj === "string") {
        try {
          obj = JSON.parse(obj);
        } catch {
          obj = {};
        }
      }
      return {
        id: genLocalId(),
        size: obj?.size || "",
        // store rupees (derived) purely for input convenience; convert later
        priceRupees: obj?.price_cents
          ? (Number(obj.price_cents) / 100).toString()
          : "",
        images: Array.isArray(obj?.images)
          ? obj.images
              .filter((id) => typeof id === "string" && id.trim())
              .map((fid) => ({
                id: genLocalId(),
                type: "existing",
                fileId: fid,
                file: null,
                preview: getImageUrl(fid),
              }))
          : [],
      };
    })
    .filter((ps) => ps.size || ps.priceRupees || ps.images.length);
}

function getFriendlyErrorMessage(error) {
  if (!error) return "";
  if (error.code === 409 || /already exists|duplicate/i.test(error.message))
    return "A product with this name or slug already exists.";
  if (error.code === 0 || /network|connection/i.test(error.message))
    return "Unable to connect to the server.";
  if (/invalid/i.test(error.message))
    return `Invalid input: ${error.message}. Check the browser console for details.`;
  return "Unexpected error. Please try again.";
}

export default function ProductsForm({ onSuccess, initialData = null }) {
  const isEdit = !!initialData;
  const categories = useSelector((state) => state.categories.items) || [];

  // ---- React Hook Form (only for top-level fields) ----
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      discount: initialData?.discount ?? 0,
      stock: initialData?.stock ?? "",
      // Use existing modes if valid array, otherwise default to both
      allowed_payment_modes:
        Array.isArray(initialData?.allowed_payment_modes) &&
        initialData.allowed_payment_modes.length > 0
          ? initialData.allowed_payment_modes
          : ["COD", "ONLINE"],
      category:
        initialData?.categories?.$id ??
        (typeof initialData?.categories === "string"
          ? initialData.categories
          : "") ??
        "",
      isBestseller: initialData?.isBestseller || false,
      isSubscriptionAllowed: initialData?.isSubscriptionAllowed || false,
    },
  });

  // ---- Packaging Sizes State ----
  const [packagingSizes, setPackagingSizes] = useState(() => {
    // If editing and have data, parse it; otherwise start with one row by default
    const parsed = parsePackagingSizes(initialData?.packaging_size);
    return parsed && parsed.length ? parsed : [createEmptyPackagingSize()];
  });

  // NEW: Batches State (optional)
  const [batches, setBatches] = useState(() => parseBatches(initialData?.batch));

  // Track files (fileIds) scheduled for deletion AFTER successful submit
  const filesPendingDeletionRef = useRef(new Set());

  // Track all object URLs to revoke on unmount
  const objectUrlsRef = useRef([]);

  // Auto slug generation (creation mode only)
  const nameValue = watch("name");
  useEffect(() => {
    if (!isEdit) {
      const slug = (nameValue || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", slug);
    }
  }, [nameValue, isEdit, setValue]);

  // Reset on new initialData
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        sku: initialData.sku || "",
        description: initialData.description || "",
        discount: initialData.discount ?? 0,
        stock: initialData.stock ?? "",
        // Use existing modes if valid array, otherwise default to both
        allowed_payment_modes:
          Array.isArray(initialData?.allowed_payment_modes) &&
          initialData.allowed_payment_modes.length > 0
            ? initialData.allowed_payment_modes
            : ["COD", "ONLINE"],
        category:
          initialData?.categories?.$id ??
          (typeof initialData?.categories === "string"
            ? initialData.categories
            : "") ??
          "",
        isBestseller: initialData.isBestseller || false,
        isSubscriptionAllowed: initialData.isSubscriptionAllowed || false,
      });
      setPackagingSizes(parsePackagingSizes(initialData.packaging_size));
      // NEW: reset batches from initial data
      setBatches(parseBatches(initialData.batch));
      filesPendingDeletionRef.current = new Set();
    }
  }, [initialData, isEdit, reset]);

  // Cleanup object URLs on unmount
  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];
    },
    []
  );

  // ---- Handlers for Packaging Sizes ----
  const addPackagingSize = () => {
    setPackagingSizes((prev) => [...prev, createEmptyPackagingSize()]);
  };

  const updatePackagingSizeField = (psId, field, value) => {
    setPackagingSizes((prev) =>
      prev.map((p) => (p.id === psId ? { ...p, [field]: value } : p))
    );
  };

  const removePackagingSize = (psId) => {
    setPackagingSizes((prev) => {
      const target = prev.find((p) => p.id === psId);
      if (target) {
        // schedule all existing images for deletion
        target.images.forEach((img) => {
          if (img.type === "existing" && img.fileId)
            filesPendingDeletionRef.current.add(img.fileId);
          if (img.type === "new" && img.preview) {
            URL.revokeObjectURL(img.preview);
          }
        });
      }
      return prev.filter((p) => p.id !== psId);
    });
  };

  // ---- Image Management ----
  const addImage = (psId, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    objectUrlsRef.current.push(preview);
    setPackagingSizes((prev) =>
      prev.map((p) =>
        p.id === psId
          ? p.images.length >= MAX_IMAGES_PER_SIZE
            ? p
            : {
                ...p,
                images: [
                  ...p.images,
                  {
                    id: genLocalId(),
                    type: "new",
                    file,
                    fileId: null,
                    preview,
                  },
                ],
              }
          : p
      )
    );
  };

  const swapImage = (psId, imageId, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    objectUrlsRef.current.push(preview);
    setPackagingSizes((prev) =>
      prev.map((p) => {
        if (p.id !== psId) return p;
        const newImages = p.images.map((img) => {
          if (img.id !== imageId) return img;
          // schedule deletion of old if existing
          if (img.type === "existing" && img.fileId) {
            filesPendingDeletionRef.current.add(img.fileId);
          }
          if (img.type === "new" && img.preview) {
            URL.revokeObjectURL(img.preview);
          }
          return {
            id: genLocalId(),
            type: "new",
            file,
            fileId: null,
            preview,
          };
        });
        return { ...p, images: newImages };
      })
    );
  };

  const removeImage = (psId, imageId) => {
    setPackagingSizes((prev) =>
      prev.map((p) => {
        if (p.id !== psId) return p;
        const img = p.images.find((i) => i.id === imageId);
        if (!img) return p;
        if (img.type === "existing" && img.fileId) {
          filesPendingDeletionRef.current.add(img.fileId);
        }
        if (img.type === "new" && img.preview) {
          URL.revokeObjectURL(img.preview);
        }
        return {
          ...p,
          images: p.images.filter((i) => i.id !== imageId),
        };
      })
    );
  };

  // File input refs per action
  const hiddenInputsRef = useRef({}); // key => callback
  const triggerFileDialog = (key, cb) => {
    hiddenInputsRef.current[key] = cb;
    const el = document.getElementById(key);
    if (el) el.click();
  };

  const handleHiddenInputChange = (e, cb, key) => {
    const file = e.target.files?.[0];
    if (file) cb(file);
    e.target.value = "";
    if (hiddenInputsRef.current[key]) delete hiddenInputsRef.current[key];
  };

  // ---- Validation before submit ----
  const validatePackagingSizes = () => {
    if (packagingSizes.length === 0) {
      return "At least one packaging size is required.";
    }
    for (let i = 0; i < packagingSizes.length; i++) {
      const ps = packagingSizes[i];
      if (!ps.size.trim()) {
        return `Packaging size #${i + 1}: size label is required.`;
      }
      if (
        !ps.priceRupees ||
        isNaN(Number(ps.priceRupees)) ||
        Number(ps.priceRupees) <= 0
      ) {
        return `Packaging size #${i + 1}: price must be a positive number.`;
      }
      if (ps.images.length === 0) {
        return `Packaging size #${i + 1}: at least one image is required.`;
      }
      // main photo presence ensured by images[0]
      if (!ps.images[0]) {
        return `Packaging size #${i + 1}: main image missing.`;
      }
    }
    return null;
  };

  // ---- Assemble payload ----
  const buildPackagingSizePayload = async () => {
    // Upload all new images first
    const uploadedMap = new Map(); // local image id => fileId
    for (const ps of packagingSizes) {
      for (const img of ps.images) {
        if (img.type === "new" && img.file && !uploadedMap.has(img.id)) {
          const res = await appwriteService.uploadFile(img.file);
          if (!res || !res.$id) throw new Error("Image upload failed.");
          uploadedMap.set(img.id, res.$id);
        }
      }
    }

    // Construct final array (objects)
    return packagingSizes.map((ps) => ({
      size: ps.size.trim(),
      price_cents: Math.round(Number(ps.priceRupees) * 100).toString(),
      images: ps.images.map((img) =>
        img.type === "existing" ? img.fileId : uploadedMap.get(img.id)
      ),
    }));
  };

  // ---- Submit ----
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (formData) => {
    setSubmitError("");

    const validationError = validatePackagingSizes();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      const packaging_size = await buildPackagingSizePayload();

      // NEW: sanitize batches; optional -> null if none valid
      const sanitizedBatches = (Array.isArray(batches) ? batches : [])
        .map((b) => ({
          name: String(b?.name ?? "").trim(),
          delivery_date: toStoredDate(b?.delivery_date),
        }))
        .filter((b) => b.name && b.delivery_date);
      const batch = sanitizedBatches.length ? sanitizedBatches : null;

      const payloadBase = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        sku: formData.sku,
        categories: formData.category || "",
        discount: parseInt(formData.discount, 10) || 0,
        stock: formData.stock !== "" && formData.stock !== undefined
          ? parseInt(formData.stock, 10)
          : null,
        packaging_size,
        // currency omitted (defaults to "INR" server-side)
        batch, // NEW
        allowed_payment_modes: formData.allowed_payment_modes, // NEW
        isBestseller: formData.isBestseller,
        isSubscriptionAllowed: formData.isSubscriptionAllowed,
      };

      let result;
      if (isEdit) {
        result = await appwriteService.updateProduct(formData.slug, payloadBase);
      } else {
        result = await appwriteService.createProduct(payloadBase);
      }

      // Best-effort deletion of replaced/removed images
      const toDelete = Array.from(filesPendingDeletionRef.current);
      if (toDelete.length) {
        Promise.allSettled(
          toDelete.map((fid) => appwriteService.deleteFile(fid))
        ).catch(() => {});
      }
      filesPendingDeletionRef.current = new Set();

      // Clear local object URLs for NEW images (existing just remote)
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current = [];

      if (!isEdit) {
        reset({
          name: "",
          slug: "",
          sku: "",
          description: "",
          discount: 0,
          stock: "",
          category: "",
          allowed_payment_modes: ["COD", "ONLINE"],
          isBestseller: false,
          isSubscriptionAllowed: false,
        });
        // New: after creating a product, keep one default row instead of empty
        setPackagingSizes([createEmptyPackagingSize()]);
        // NEW: clear batches on fresh create
        setBatches([]);
      }

      if (onSuccess) onSuccess(result);
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
    }
  };

  // ---- Render helpers ----
  const renderImageSlot = (ps, img, idx) => {
    const keySwap = `swap-${ps.id}-${img.id}`;
    return (
      <div
        key={img.id}
        className="relative group rounded-lg overflow-hidden border shadow-sm"
      >
        <img
          src={img.preview}
          alt="Preview"
          className="w-32 h-32 object-cover block"
        />

        {/* Main badge */}
        {idx === 0 && (
          <span className="absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow">
            Main
          </span>
        )}

        {/* Controls on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className="!bg-white !text-gray-800 hover:!bg-gray-100"
            onClick={() =>
              triggerFileDialog(keySwap, (file) =>
                swapImage(ps.id, img.id, file)
              )
            }
            disabled={isSubmitting}
          >
            Swap
          </Button>
          {idx !== 0 && (
            <Button
              type="button"
              variant="danger"
              size="xs"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={() => removeImage(ps.id, img.id)}
              disabled={isSubmitting}
            >
              Remove
            </Button>
          )}
        </div>

        <input
          id={keySwap}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleHiddenInputChange(
              e,
              (file) => swapImage(ps.id, img.id, file),
              keySwap
            )
          }
        />
      </div>
    );
  };

  const renderAddImageButton = (ps) => {
    const keyAdd = `add-${ps.id}`;
    return (
      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-emerald-700 hover:border-emerald-600 transition-colors">
        <Button
          type="button"
          variant="secondary"
          size="xs"
          className="!bg-white !text-emerald-700 border border-emerald-600 hover:!bg-emerald-50"
          onClick={() =>
            triggerFileDialog(keyAdd, (file) => addImage(ps.id, file))
          }
          disabled={isSubmitting}
          title="Add image"
        >
          + Add
        </Button>
        <input
          id={keyAdd}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleHiddenInputChange(e, (file) => addImage(ps.id, file), keyAdd)
          }
        />
        <span className="text-[10px] mt-1">
          {ps.images.length}/{MAX_IMAGES_PER_SIZE}
        </span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#084629]">
          {isEdit ? "Edit Product" : "Add New Product"}
        </h2>
        <span className="text-xs text-gray-500">Currency: INR (default)</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 bg-white p-4 rounded-lg border">
        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            placeholder="Product Name"
            disabled={isSubmitting}
            {...register("name", { required: "Name is required" })}
            error={errors.name?.message}
          />
        </div>

        {/* Slug (locked in edit) */}
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            disabled
            {...register("slug")}
            error={errors.slug?.message}
          />
          <p className="text-[11px] text-gray-500">Auto-generated from name.</p>
        </div>

        {/* SKU */}
        <div className="space-y-1">
          <Label htmlFor="sku" required>
            SKU
          </Label>
          <Input
            id="sku"
            placeholder="SKU"
            disabled={isSubmitting}
            {...register("sku", { required: "SKU is required" })}
            error={errors.sku?.message}
          />
        </div>

        {/* Discount */}
        <div className="space-y-1">
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="99"
            disabled={isSubmitting}
            {...register("discount", {
              min: { value: 0, message: "Min 0" },
              max: { value: 99, message: "Max 99" },
            })}
            error={errors.discount?.message}
          />
          <p className="text-[11px] text-gray-500">Optional.</p>
        </div>

        {/* Stock */}
        <div className="space-y-1">
          <Label htmlFor="stock">Stock (units)</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            placeholder="e.g. 100"
            disabled={isSubmitting}
            onFocus={(e) => e.target.select()}
            {...register("stock", {
              min: { value: 0, message: "Stock cannot be negative" },
            })}
            error={errors.stock?.message}
          />
          {(() => {
            const s = parseInt(watch("stock"), 10);
            if (isNaN(s) || watch("stock") === "") return <p className="text-[11px] text-gray-500">Leave empty if not tracking stock.</p>;
            if (s === 0) return <p className="text-[11px] text-red-600 font-semibold">⚠ Out of stock</p>;
            if (s <= 10) return <p className="text-[11px] text-amber-600 font-semibold">⚠ Low stock</p>;
            return <p className="text-[11px] text-emerald-600">✓ In stock</p>;
          })()}
        </div>

        {/* Category */}
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="category" required>
            Category
          </Label>
          <Select
            id="category"
            placeholder="Select category"
            disabled={isSubmitting}
            options={categories.map((c) => ({
              value: c.$id,
              label: c.name,
            }))}
            value={watch("category")}
            onValueChange={(val) => {
              setValue("category", val, { shouldValidate: true });
              clearErrors("category");
            }}
          />
          {errors.category && (
            <div className="text-red-600 text-sm mt-1">
              {errors.category.message}
            </div>
          )}
        </div>

        {/* Payment Modes Selection */}
        <div className="md:col-span-2 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 space-y-3">
          <Label required>Allowed Payment Modes</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                value="COD"
                className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                checked={watch("allowed_payment_modes")?.includes("COD")}
                onChange={(e) => {
                  const current = watch("allowed_payment_modes") || [];
                  if (e.target.checked) {
                    setValue("allowed_payment_modes", [...current, "COD"]);
                  } else {
                    setValue("allowed_payment_modes", current.filter(m => m !== "COD"));
                  }
                }}
              />
              <span className="text-sm font-semibold text-[#084629] group-hover:text-emerald-700">Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                value="ONLINE"
                className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                checked={watch("allowed_payment_modes")?.includes("ONLINE")}
                onChange={(e) => {
                  const current = watch("allowed_payment_modes") || [];
                  if (e.target.checked) {
                    setValue("allowed_payment_modes", [...current, "ONLINE"]);
                  } else {
                    setValue("allowed_payment_modes", current.filter(m => m !== "ONLINE"));
                  }
                }}
              />
              <span className="text-sm font-semibold text-[#084629] group-hover:text-emerald-700">Online Payment (Razorpay)</span>
            </label>
          </div>
          <p className="text-[11px] text-gray-500 italic">Select which payment methods are available for this product.</p>
        </div>

        {/* Bestseller Toggle */}
        <div className="md:col-span-2 bg-amber-50/30 p-4 rounded-xl border border-amber-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isBestseller">Bestseller Product</Label>
              <p className="text-[11px] text-gray-500 italic">Mark this product to be featured in the "Bestsellers" section on the home page.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                id="isBestseller"
                type="checkbox"
                className="sr-only peer"
                checked={watch("isBestseller")}
                onChange={(e) => setValue("isBestseller", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Subscription Toggle */}
        <div className="md:col-span-2 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isSubscriptionAllowed">Allow Subscription</Label>
              <p className="text-[11px] text-gray-500 italic">Enable recurring orders for this product (Weekly/Monthly).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                id="isSubscriptionAllowed"
                type="checkbox"
                className="sr-only peer"
                checked={watch("isSubscriptionAllowed")}
                onChange={(e) => setValue("isSubscriptionAllowed", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white p-4 rounded-lg border space-y-2">
        <Label htmlFor="description" required>
          Description
        </Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Product description..."
          disabled={isSubmitting}
          {...register("description", { required: "Description is required" })}
          error={errors.description?.message}
        />
        <p className="text-[11px] text-gray-500">
          Describe key benefits, ingredients, and usage.
        </p>
      </div>

      {/* NEW: Batches (Optional) */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Batches (optional)</Label>
            <p className="text-[12px] text-gray-600">
              Manage upcoming batches. Labels like “Batch 00, Batch 01” are for display only.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="border border-emerald-700 !text-emerald-700 hover:!bg-emerald-50"
            onClick={() =>
              setBatches((prev) => [
                ...prev,
                { id: genLocalId(), name: "", delivery_date: "" },
              ])
            }
            disabled={isSubmitting}
            title="Add Batch"
          >
            + Add Batch
          </Button>
        </div>

        {batches.length === 0 && (
          <div className="text-sm text-gray-500">No batches added.</div>
        )}

        <div className="space-y-4">
          {batches.map((b, idx) => (
            <div key={b.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Batch {pad2(idx)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Provide name and delivery date.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="xs"
                  className={`${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isSubmitting}
                  onClick={() =>
                    setBatches((prev) => prev.filter((x) => x.id !== b.id))
                  }
                  title="Remove Batch"
                >
                  Remove
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Batch Name</Label>
                  <Input
                    placeholder="e.g. Monsoon Harvest"
                    value={b.name}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setBatches((prev) =>
                        prev.map((x) =>
                          x.id === b.id ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={b.delivery_date}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setBatches((prev) =>
                        prev.map((x) =>
                          x.id === b.id
                            ? { ...x, delivery_date: e.target.value }
                            : x
                        )
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging Sizes */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label required>Packaging Sizes</Label>
            <p className="text-[12px] text-gray-600">
              Each size must include at least one image. The first image is the
              main image (swap only).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="border border-emerald-700 !text-emerald-700 hover:!bg-emerald-50"
            onClick={addPackagingSize}
            disabled={isSubmitting}
            title="Add Packaging Size"
          >
            + Add Packaging Size
          </Button>
        </div>

        {packagingSizes.length === 0 && (
          <div className="text-sm text-gray-500">
            No packaging sizes added yet.
          </div>
        )}

        <div className="space-y-6">
          {packagingSizes.map((ps, idx) => (
            <div
              key={ps.id}
              className="border rounded-lg p-4 space-y-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#084629]">
                  Packaging Size #{idx + 1}
                </h3>
                <Button
                  type="button"
                  variant="danger"
                  size="xs"
                  className={`${
                    isSubmitting || packagingSizes.length === 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={isSubmitting || packagingSizes.length === 1}
                  onClick={() => removePackagingSize(ps.id)}
                  title={
                    packagingSizes.length === 1
                      ? "At least one size required"
                      : "Remove this size"
                  }
                >
                  Remove
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label required>Size Label</Label>
                  <Input
                    value={ps.size}
                    placeholder="e.g. 500g"
                    disabled={isSubmitting}
                    onChange={(e) =>
                      updatePackagingSizeField(ps.id, "size", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label required>Price (INR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ps.priceRupees}
                    placeholder="e.g. 499.00"
                    disabled={isSubmitting}
                    onChange={(e) =>
                      updatePackagingSizeField(
                        ps.id,
                        "priceRupees",
                        e.target.value
                      )
                    }
                  />
                  <p className="text-[11px] text-gray-500">Stored as cents.</p>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <div className="text-[12px] text-gray-600 pt-2">
                    Main image is non-deletable; swap to replace it.
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="flex items-center justify-between">
                  <Label required>Images</Label>
                  <span className="text-[12px] text-gray-500">
                    Max {MAX_IMAGES_PER_SIZE} images
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {ps.images.map((img, i) => renderImageSlot(ps, img, i))}
                  {ps.images.length < MAX_IMAGES_PER_SIZE &&
                    renderAddImageButton(ps)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="text-red-600 text-sm font-medium">{submitError}</div>
      )}

      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 py-3 border-t">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
