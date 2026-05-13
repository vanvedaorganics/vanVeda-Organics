// utils/getImageUrl.js
import conf from "../src/conf/conf";

export const getImageUrl = (fileId, width = 600) => {
  if (!fileId) return "/placeholder.svg";

  // Brave browser on live sites is very sensitive to URL parameters.
  // We'll use the most standard /preview format possible.
  const baseUrl = `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/preview`;
  
  // We only keep the absolutely required parameters.
  // We removed quality and output=webp to reduce the chance of Brave Shields blocking the request.
  return `${baseUrl}?project=${conf.appwriteProjectId}&width=${width}`;
};

