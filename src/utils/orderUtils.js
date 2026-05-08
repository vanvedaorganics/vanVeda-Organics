/**
 * Consistently formats an Appwrite document ID into a human-friendly Order ID.
 * Standardizes on the last 8 characters, uppercased.
 * 
 * @param {string} id - The Appwrite document ID
 * @returns {string} - The formatted Order ID (e.g., "B3A7F1C2")
 */
export const formatOrderId = (id) => {
  if (!id) return "PENDING";
  // Use last 8 chars, uppercase. This is unique enough for most stores
  // and much more readable than the full 20+ char Appwrite ID.
  return id.slice(-8).toUpperCase();
};
