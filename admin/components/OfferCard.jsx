import React from "react";
import { motion } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateProductDiscount } from "../../src/store/productsSlice";
import conf from "../../src/conf/conf";

/**
 * OfferCard: displays product, discount, image, prices and actions
 * props:
 * - product: product object
 * - onEdit: function(product) => opens edit modal in parent
 */
export default function OfferCard({ product, onEdit }) {
  const dispatch = useDispatch();

  const handleRemove = async () => {
    try {
      await dispatch(updateProductDiscount({ productId: product.$id, discount: 0 }));
    } catch (err) {
      console.error("Failed to remove discount:", err);
    }
  };

  // Build image URL (Appwrite view endpoint)
  const imageUrl =
    product?.image_file_ids &&
    `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${product.image_file_ids}/view?project=${conf.appwriteProjectId}`;

  // Category (string or expanded object)
  const category =
    typeof product.categories === "string"
      ? product.categories.charAt(0).toUpperCase() + product.categories.slice(1)
      : product.categories?.name || "—";

  // Pricing
  const originalPrice = Number(product.price_cents || 0) / 100;
  const discountPercent = Number(product.discount || 0);
  const discountedPrice = originalPrice * (1 - discountPercent / 100);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      whileHover={{
        translateY: -4,
        boxShadow: "0 12px 30px rgba(3,7,18,0.12)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200 ease-out"
      aria-label={`Offer Card: ${product.name}`}
      role="group"
    >
      <header className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={product.name}>
          {product.name}
        </h3>
      </header>

      <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-20 h-20 rounded-lg object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        <div className="flex-1 space-y-1">
          <p className="text-sm text-gray-700">Category: {category}</p>
          <p className="text-sm text-gray-700">Discount: {discountPercent}%</p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 line-through">
              ₹{originalPrice.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-green-600">
              ₹{discountedPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit && onEdit(product)}
            aria-label={`Edit ${product.name}`}
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300"
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            onClick={handleRemove}
            aria-label={`Remove discount from ${product.name}`}
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-300 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
