// utils/getImageUrl.js
import conf from "../src/conf/conf";

export const getImageUrl = (fileId) => {
  if (!fileId) return "/placeholder.svg";

  // Use /preview for optimized web display and better permission compatibility
  return `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/preview?project=${conf.appwriteProjectId}`;
};
