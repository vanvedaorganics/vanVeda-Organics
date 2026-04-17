import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label } from "./index";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { getImageUrl } from "../../utils/getImageUrl";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

function getFriendlyErrorMessage(error) {
  if (!error) return "";
  if (error.code === 409 || /already exists|duplicate/i.test(error.message)) {
    return "A category with this name or slug already exists.";
  }
  if (error.code === 0 || /network|connection/i.test(error.message)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  return error.message || "An unexpected error occurred. Please try again.";
}

// Reusable image upload block
function ImageUploadBlock({ label, hint, previewUrl, onFileChange, onClear, isSubmitting }) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="mt-2 flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-white hover:border-[#dfb96a]/50 transition-all group relative overflow-hidden min-h-[140px]">
        {previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-28 object-contain rounded-lg shadow-sm"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={isSubmitting}
              className="absolute top-0 right-0 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-[#084629] group-hover:scale-110 transition-all duration-300 shadow-sm">
              <Upload size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-[#084629]">Click to upload</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onFileChange}
              disabled={isSubmitting}
            />
          </label>
        )}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1.5 text-center">{hint}</p>}
    </div>
  );
}

export default function CategoriesForm({ onSuccess, initialData = null }) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      imageId: initialData?.imageId || "",
      navIcon: initialData?.navIcon || "",
    },
  });

  const [submitError, setSubmitError] = useState("");

  // Main category icon
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(
    initialData?.imageId ? getImageUrl(initialData.imageId) : null
  );

  // Mobile nav icon
  const [navIconFile, setNavIconFile] = useState(null);
  const [navIconPreview, setNavIconPreview] = useState(
    initialData?.navIcon ? getImageUrl(initialData.navIcon) : null
  );

  // Auto-generate slug from name (only if not editing)
  const nameValue = watch("name");
  useEffect(() => {
    if (!isEdit) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", slug, { shouldValidate: true });
    }
  }, [nameValue, setValue, isEdit]);

  const onIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const clearIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setValue("imageId", "");
  };

  const onNavIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNavIconFile(file);
      setNavIconPreview(URL.createObjectURL(file));
    }
  };

  const clearNavIcon = () => {
    setNavIconFile(null);
    setNavIconPreview(null);
    setValue("navIcon", "");
  };

  const onSubmit = async (data) => {
    try {
      setSubmitError("");

      // Upload main icon if a new file was selected
      let workingImageId = data.imageId || null;
      if (iconFile) {
        const uploaded = await appwriteService.uploadFile(iconFile);
        workingImageId = uploaded.$id;
      }

      // Upload nav icon if a new file was selected
      let workingNavIconId = data.navIcon || null;
      if (navIconFile) {
        const uploaded = await appwriteService.uploadFile(navIconFile);
        workingNavIconId = uploaded.$id;
      }

      if (isEdit) {
        await appwriteService.updateCategory(initialData.$id || initialData.slug, {
          name: data.name,
          imageId: workingImageId,
          navIcon: workingNavIconId,
        });
        toast.success("Category updated successfully");
      } else {
        await appwriteService.createCategory({
          name: data.name,
          slug: data.slug,
          imageId: workingImageId,
          navIcon: workingNavIconId,
        });
        toast.success("Category created successfully");
        reset();
        setIconPreview(null);
        setIconFile(null);
        setNavIconPreview(null);
        setNavIconFile(null);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name + Slug row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" required>Category Name</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            placeholder="e.g. Fruits, Ghee, Honey"
            disabled={isSubmitting}
            error={errors.name?.message}
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug (URL identifier)</Label>
          <Input
            id="slug"
            {...register("slug")}
            value={watch("slug")}
            disabled
            placeholder="auto-generated"
            className="bg-gray-50 text-gray-500 font-mono text-xs"
          />
        </div>
      </div>

      {/* Image uploads row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploadBlock
          label="Category Icon / Image"
          hint="Used on product pages and category listings. PNG or SVG recommended."
          previewUrl={iconPreview}
          onFileChange={onIconChange}
          onClear={clearIcon}
          isSubmitting={isSubmitting}
        />

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Label>Mobile Nav Icon</Label>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-100">Mobile Nav</span>
          </div>
          <div className="mt-1 flex-1 border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-emerald-50/30 hover:bg-white hover:border-emerald-400/50 transition-all group relative overflow-hidden min-h-[140px]">
            {navIconPreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={navIconPreview}
                  alt="Nav Icon Preview"
                  className="max-h-28 object-contain rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={clearNavIcon}
                  disabled={isSubmitting}
                  className="absolute top-0 right-0 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer w-full h-full py-6 flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-medium text-emerald-600/70 group-hover:text-emerald-700 text-center">
                  Upload icon for mobile nav bar
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onNavIconChange}
                  disabled={isSubmitting}
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Square image (e.g. 64×64px) works best. Falls back to Category Icon if not set.
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          {submitError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="flex-1 rounded-xl h-12 shadow-lg shadow-[#dfb96a]/10"
        >
          {isSubmitting ? "Processing..." : isEdit ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}