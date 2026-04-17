import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Label } from "../index";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { getImageUrl } from "../../utils/getImageUrl";
import { X, Upload, ImageIcon } from "lucide-react";
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
    },
  });

  const [submitError, setSubmitError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageId ? getImageUrl(initialData.imageId) : null);

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

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue("imageId", "");
  };

  const onSubmit = async (data) => {
    try {
      setSubmitError("");
      let workingImageId = data.imageId;

      // 1. Handle image upload if a new file was selected
      if (selectedFile) {
        // If editing and we had an old image, we could delete it here, 
        // but often it's safer to let the service or a cleanup task handle it.
        const uploaded = await appwriteService.uploadFile(selectedFile);
        workingImageId = uploaded.$id;
      }

      // 2. Create or Update category
      if (isEdit) {
        await appwriteService.updateCategory(initialData.$id || initialData.slug, {
          name: data.name,
          imageId: workingImageId,
        });
        toast.success("Category updated successfully");
      } else {
        await appwriteService.createCategory({
          name: data.name,
          slug: data.slug,
          imageId: workingImageId,
        });
        toast.success("Category created successfully");
        reset();
        setPreviewUrl(null);
        setSelectedFile(null);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitError(getFriendlyErrorMessage(err));
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <Label htmlFor="name" required>
              Category Name
            </Label>
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

        {/* Image Upload Section */}
        <div className="flex flex-col">
          <Label>Category Icon / Image</Label>
          <div className="mt-2 flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-white hover:border-[#dfb96a]/50 transition-all group relative overflow-hidden">
            {previewUrl ? (
              <div className="relative w-full h-full min-h-[140px] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-32 object-contain rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-0 right-0 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer w-full h-full py-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-[#084629] group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-[#084629]">Click to upload icon</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">SVG or PNG recommended for icons</p>
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