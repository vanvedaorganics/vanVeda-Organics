// utils/getImageUrl.js
import conf from "../src/conf/conf";

export const getImageUrl = (fileId) => {
  if (!fileId) return "/placeholder.svg";

  // Use /view endpoint instead of /preview for free plan
  return `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/view?project=${conf.appwriteProjectId}`;
};
