// utils/getImageUrl.js
import conf from "../src/conf/conf";

export const getImageUrl = (fileId) => {
  if (!fileId) return "/placeholder.svg";

  // Use /view as it often has broader public compatibility in Appwrite Cloud
  const baseUrl = `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/view`;
  return `${baseUrl}?project=${conf.appwriteProjectId}`;
};
