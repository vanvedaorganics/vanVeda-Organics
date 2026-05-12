// utils/getImageUrl.js
import conf from "../src/conf/conf";

export const getImageUrl = (fileId, width = 600) => {
  if (!fileId) return "/placeholder.svg";

  // Use /preview with compression parameters to significantly reduce bandwidth usage
  const baseUrl = `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/preview`;
  return `${baseUrl}?project=${conf.appwriteProjectId}&width=${width}&quality=70&output=webp`;
};
