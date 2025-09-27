import React, { useState, useMemo, useEffect } from "react";
import { Button, ProductOfferModal, CardGrid } from "../components";
import { Plus, Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { getImageUrl } from "../../utils/getImageUrl";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { fetchProducts } from "../../src/store/productsSlice";

// ---- Helpers (aligned with Products / ProductOfferModal) ----
const parsePackagingSizes = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      try {
        const obj = typeof item === "string" ? JSON.parse(item) : item || {};
        return {
          size: obj?.size || "",
          price_cents: obj?.price_cents ? Number(obj.price_cents) : undefined,
          images: Array.isArray(obj?.images) ? obj.images.filter(Boolean) : [],
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const getMainImageId = (packaging) => {
  const first = packaging?.find(
    (p) => Array.isArray(p.images) && p.images.length > 0
  );
  return first?.images?.[0] || "";
};

const formatINR = (cents) => `₹${(cents / 100).toFixed(2)}`;

const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (d <= 0) return cents;
  return Math.round((cents * (100 - d)) / 100);
};

// ---- Motion variants (subtle like Advertisement cards) ----
const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.18 } },
  hover: { y: -2, scale: 1.01 },
  tap: { scale: 0.995 },
};

export default function Offers() {
  const dispatch = useDispatch();
  const { items: products, loading, error, fetched } = useSelector(
    (s) => s.products
  );

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Ensure products are loaded
  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, fetched, loading]);

  // Filter discounted items
  const discounted = useMemo(
    () => (products || []).filter((p) => Number(p.discount) > 0),
    [products]
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setOfferModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setOfferModalOpen(true);
  };

  const handleRemoveOffer = async (product) => {
    if (!product?.$id || removingId) return;
    const id = product.$id;
    try {
      setRemovingId(id);
      await appwriteService.updateProductDiscount(id, 0);
      dispatch(fetchProducts());
    } catch (e) {
      console.error("Failed to remove offer:", e);
    } finally {
      setRemovingId(null);
    }
  };

  // ---- Skeleton while loading (styled like Advertisement page) ----
  const renderSkeletons = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="w-full bg-white rounded-2xl p-5 shadow-md animate-pulse"
      >
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="border border-gray-200 rounded-xl p-4 grid grid-cols-[96px_1fr] gap-4 items-center">
          <div className="h-24 w-24 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
        <div className="mt-3 h-9 bg-gray-200 rounded" />
      </div>
    ));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">
            Offers Management
          </h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Upload and Manage your products' offers here
          </h2>
        </div>

        <div>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center"
            onClick={openAddModal}
            disabled={loading}
          >
            <Plus size={15} className="mr-1" /> Add Offers
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-3">
          Failed to load offers. Please try again.
        </div>
      )}

      <CardGrid className="mt-6">
        {loading
          ? renderSkeletons()
          : discounted.length > 0
          ? (
          <AnimatePresence initial={false}>
            {discounted.map((p) => {
              const packaging = parsePackagingSizes(p.packaging_size);
              const mainFileId = getMainImageId(packaging);
              const mainUrl = mainFileId ? getImageUrl(mainFileId) : "";
              const isRemoving = removingId === p.$id;

              return (
                <motion.div
                  key={p.$id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  whileTap="tap"
                  className="group will-change-transform"
                >
                  <div className="relative w-full bg-white rounded-2xl p-5 shadow-md transition-shadow overflow-hidden group-hover:shadow-lg">
                    {/* Body: Image + Info */}
                    <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
                      {/* Image section */}
                      <div className="flex items-center justify-center">
                        {mainUrl ? (
                          <img
                            src={mainUrl}
                            alt={p.name}
                            className={`w-24 h-24 object-cover rounded ${
                              isRemoving ? "opacity-50" : ""
                            }`}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded bg-gray-100" />
                        )}
                      </div>

                      {/* Info section */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-base font-semibold text-[#084629]">
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {typeof p.categories === "object"
                                ? p.categories?.name ?? "—"
                                : typeof p.categories === "string"
                                ? p.categories.charAt(0).toUpperCase() +
                                  p.categories.slice(1)
                                : "—"}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 h-fit">
                            -{Number(p.discount) || 0}%
                          </span>
                        </div>

                        {/* Per-size pricing with discount applied */}
                        <div className="mt-1 grid grid-cols-1 gap-1">
                          {packaging.length ? (
                            packaging.map((ps, idx) => {
                              const cents =
                                typeof ps.price_cents === "number"
                                  ? ps.price_cents
                                  : NaN;
                              if (Number.isNaN(cents) || cents <= 0) {
                                return (
                                  <div
                                    key={`${ps.size}-${idx}`}
                                    className="text-sm text-gray-500"
                                  >
                                    {ps.size || "—"}: —
                                  </div>
                                );
                              }
                              const discountedCents = discountPrice(
                                cents,
                                p.discount
                              );
                              const hasDiscount = Number(p.discount) > 0;

                              return (
                                <div
                                  key={`${ps.size}-${idx}`}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {ps.size || "—"}
                                  </span>
                                  {!hasDiscount ? (
                                    <span className="text-gray-800">
                                      {formatINR(cents)}
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-gray-400 line-through">
                                        {formatINR(cents)}
                                      </span>
                                      <span className="text-emerald-700 font-medium">
                                        {formatINR(discountedCents)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500">
                              No packaging sizes.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer: Actions */}
                    <div className="mt-4 border-t bg-gray-50/60 px-4 py-3 flex items-center justify-end gap-2 rounded-b-2xl -mx-5">
                      <Button
                        variant=""
                        className={`bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center ${
                          isRemoving ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                        onClick={() => handleEdit(p)}
                        disabled={isRemoving}
                        title={isRemoving ? "Processing..." : "Edit Offer"}
                      >
                        Edit Offer
                      </Button>
                      <Button
                        variant="destructive"
                        className={`bg-red-600 hover:bg-red-700 text-white ${
                          isRemoving ? "opacity-80 cursor-not-allowed" : ""
                        }`}
                        onClick={() => handleRemoveOffer(p)}
                        disabled={isRemoving}
                        aria-busy={isRemoving}
                        title={isRemoving ? "Removing..." : "Remove Offer"}
                      >
                        {isRemoving ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Removing...
                          </span>
                        ) : (
                          "Remove Offer"
                        )}
                      </Button>
                    </div>

                    {/* Inline overlay loader over entire card while removing */}
                    {isRemoving && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-[#084629] animate-spin" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          ) : (
          <p className="text-gray-500">No active offers.</p>
        )}
      </CardGrid>

      <ProductOfferModal
        open={offerModalOpen}
        onClose={() => {
          setOfferModalOpen(false);
          setEditingProduct(null);
        }}
        initialProduct={editingProduct}
      />
    </div>
  );
}