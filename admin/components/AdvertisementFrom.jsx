// src/components/AdvertisementForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { Input, Textarea, Button } from "./index"
import appwriteService from "../../src/appwrite/appwriteConfigService";

export default function AdvertisementForm({ onSuccess, defaultValues = null }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: defaultValues || {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      if (defaultValues?.$id) {
        // Editing
        await appwriteService.updateAd(defaultValues.$id, {
          title: data.title,
          description: data.description,
        });
      } else {
        // Creating
        await appwriteService.createAd({
          title: data.title,
          description: data.description,
        });
      }
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting ad:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Title"
        placeholder="Enter ad title"
        {...register("title", { required: "Title is required" })}
        error={errors.title?.message}
      />

      <Textarea
        id="description"
        placeholder="Enter ad description"
        {...register("description", { required: "Description is required" })}
        error={errors.description?.message}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isSubmitting}>
          {defaultValues ? "Update Advertisement" : "Create Advertisement"}
        </Button>
      </div>
    </form>
  );
}
