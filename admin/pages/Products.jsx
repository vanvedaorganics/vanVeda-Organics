import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataTable,
  Button,
  CategoriesForm,
  Modal,
  ProductsForm,
} from "../components";
import {
  Image,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { fetchProducts } from "../../src/store/productsSlice";
import { getImageUrl } from "../../utils/getImageUrl";

// Helpers to work with new schema
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

// New: discount helper
const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (d <= 0) return cents;
  return Math.round((cents * (100 - d)) / 100);
};

export default function ProductsPage() {
  const dispatch = useDispatch();
  const {
    items: products,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.products);

  // Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryItems, setGalleryItems] = useState([]); // [{ size, images: [{fileId, url}] }]
  const [activeSizeIdx, setActiveSizeIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const buildGalleryFromRow = (row) => {
    const packaging = parsePackagingSizes(row.packaging_size);
    return packaging
      .map((p) => ({
        size: p.size || "—",
        images: (Array.isArray(p.images) ? p.images : [])
          .filter(Boolean)
          .map((fid) => ({ fileId: fid, url: getImageUrl(fid) })),
      }))
      .filter((g) => g.images.length > 0);
  };

  const openGallery = (row) => {
    const items = buildGalleryFromRow(row);
    if (!items.length) return;
    setGalleryItems(items);
    setGalleryTitle(row.name || "Product Gallery");
    setActiveSizeIdx(0);
    setActiveImageIdx(0);
    setGalleryOpen(true);
  };

  const closeGallery = useCallback(() => setGalleryOpen(false), []);

  const nextImage = useCallback(() => {
    const imgs = galleryItems[activeSizeIdx]?.images || [];
    if (!imgs.length) return;
    setActiveImageIdx((i) => (i + 1) % imgs.length);
  }, [galleryItems, activeSizeIdx]);

  const prevImage = useCallback(() => {
    const imgs = galleryItems[activeSizeIdx]?.images || [];
    if (!imgs.length) return;
    setActiveImageIdx((i) => (i - 1 + imgs.length) % imgs.length);
  }, [galleryItems, activeSizeIdx]);

  // Keyboard navigation while gallery open
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, nextImage, prevImage, closeGallery]);

  // Define columns for DataTable (updated for per-size display)
  const columns = [
    {
      header: "Preview",
      accessor: "packaging_size",
      render: (row) => {
        const packaging = parsePackagingSizes(row.packaging_size);
        const fileId = getMainImageId(packaging);
        if (!fileId) {
          return (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-400 rounded">
              <Image className="w-6 h-6" />
            </div>
          );
        }
        const viewUrl = getImageUrl(fileId);
        return (
          <img
            src={viewUrl}
            alt={row.name}
            className="w-12 h-12 object-cover rounded cursor-pointer hover:ring-2 hover:ring-emerald-500 transition"
            onClick={() => openGallery(row)}
            title="View gallery"
          />
        );
      },
    },
    { header: "Name", accessor: "name" },
    { header: "Slug", accessor: "slug" },
    {
      header: "Description",
      accessor: "description",
      render: (row) => {
        const fullText = row.description || "";
        const truncated =
          fullText.length > 30 ? fullText.substring(0, 30) + "..." : fullText;

        return (
          <span
            title={fullText}
            className="cursor-help block max-w-xs truncate"
          >
            {truncated}
          </span>
        );
      },
    },
    {
      header: "Sizes",
      accessor: "packaging_size",
      render: (row) => {
        const packaging = parsePackagingSizes(row.packaging_size);
        if (!packaging.length) return "—";
        return (
          <div className="flex flex-col gap-1">
            {packaging.map((p, idx) => (
              <span
                key={`${p.size}-${idx}`}
                className="w-fit px-2 py-0.5 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {p.size || "—"}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Price (per size)",
      accessor: "packaging_size",
      render: (row) => {
        const packaging = parsePackagingSizes(row.packaging_size);
        if (!packaging.length) return "—";
        return (
          <div className="flex flex-col gap-1">
            {packaging.map((p, idx) => {
              const cents =
                typeof p.price_cents === "number" ? p.price_cents : NaN;
              if (Number.isNaN(cents) || cents <= 0) {
                return <span key={idx}>—</span>;
              }
              const hasDiscount =
                typeof row.discount === "number" && row.discount > 0;
              if (!hasDiscount) {
                return (
                  <span key={idx} className="text-gray-800">
                    {formatINR(cents)}
                  </span>
                );
              }
              const discounted = discountPrice(cents, row.discount);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-gray-400 line-through">
                    {formatINR(cents)}
                  </span>
                  <span className="text-emerald-700 font-medium">
                    {formatINR(discounted)}
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    -{row.discount}%
                  </span>
                </div>
              );
            })}
          </div>
        );
      },
    },
    { header: "SKU", accessor: "sku" },
    {
      header: "Discount",
      accessor: "discount",
      render: (row) =>
        typeof row.discount === "number" && row.discount > 0
          ? `${row.discount}%`
          : "0%",
    },
    {
      header: "Category",
      accessor: "categories",
      render: (row) => {
        if (!row.categories) return "—";
        if (typeof row.categories === "string") {
          return (
            row.categories.charAt(0).toUpperCase() + row.categories.slice(1)
          );
        }
        if (typeof row.categories === "object") {
          return row.categories.name || "—";
        }
        return "—";
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => {
        const idKey = row.$id || row.slug;
        const isDeleting = deletingId === idKey;

        return (
          <div className="flex gap-2">
            <button
              className={`p-2 rounded hover:bg-blue-50 text-blue-600 ${
                isDeleting
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
              disabled={isDeleting}
              aria-disabled={isDeleting}
              onClick={() => {
                if (isDeleting) return;
                setEditProduct(row);
                setProductModalOpen(true);
              }}
              title={isDeleting ? "Deleting..." : "Edit"}
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={async () => {
                if (isDeleting) return;
                try {
                  setDeletingId(idKey);
                  await appwriteService.deleteProduct(idKey);
                  // Refresh list after delete
                  dispatch(fetchProducts());
                } catch (err) {
                  console.error("Failed to delete product:", err);
                } finally {
                  setDeletingId(null);
                }
              }}
              className={`p-2 rounded text-red-600 ${
                isDeleting
                  ? "bg-red-50 opacity-70 cursor-not-allowed"
                  : "hover:bg-red-50"
              }`}
              disabled={isDeleting}
              aria-busy={isDeleting}
              aria-label={isDeleting ? "Deleting product" : "Delete product"}
              title={isDeleting ? "Deleting..." : "Delete"}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch products from Redux slice
  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, fetched, loading]);

  return (
    <div className="p-6">
      {/* Category Modal */}
      <Modal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        title="Add Category"
      >
        <CategoriesForm onSuccess={() => setCategoryModalOpen(false)} />
      </Modal>

      <Modal
        open={productModalOpen}
        onOpenChange={(open) => {
          setProductModalOpen(open);
          if (!open) setEditProduct(null);
        }}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <ProductsForm
          onSuccess={() => {
            setProductModalOpen(false);
            setEditProduct(null);
          }}
          initialData={editProduct}
        />
      </Modal>

      {/* Gallery Modal */}
      <Modal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        title={galleryTitle}
      >
        {galleryItems.length > 0 && (
          <div className="space-y-4">
            {/* Large viewer */}
            {galleryItems[activeSizeIdx]?.images?.[activeImageIdx]?.url && (
              <div className="relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-[220px]">
                <img
                  src={galleryItems[activeSizeIdx].images[activeImageIdx].url}
                  alt="Preview"
                  className="max-h-[50vh] max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                  title="Next"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] px-2 py-0.5 rounded-full bg-black/60 text-white">
                  {galleryItems[activeSizeIdx]?.size} • {activeImageIdx + 1}/
                  {galleryItems[activeSizeIdx]?.images?.length || 0}
                </div>
              </div>
            )}

            {/* Sections per packaging size */}
            <div className="max-h-[60vh] overflow-auto space-y-6">
              {galleryItems.map((group, sIdx) => (
                <div key={`${group.size}-${sIdx}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded border ${
                        activeSizeIdx === sIdx
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {group.size}
                    </span>
                    <span className="text-xs text-gray-500">
                      {group.images.length} image
                      {group.images.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {group.images.map((img, iIdx) => {
                      const isActive =
                        activeSizeIdx === sIdx && activeImageIdx === iIdx;
                      return (
                        <button
                          key={img.fileId}
                          type="button"
                          className={`group relative border rounded overflow-hidden focus:outline-none ${
                            isActive
                              ? "ring-2 ring-emerald-600"
                              : "hover:ring-1 ring-emerald-300"
                          }`}
                          onClick={() => {
                            setActiveSizeIdx(sIdx);
                            setActiveImageIdx(iIdx);
                          }}
                          title="View"
                        >
                          <img
                            src={img.url}
                            alt={group.size}
                            className="h-24 w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                onClick={closeGallery}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">
            Products Management
          </h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Upload and Manage your products here
          </h2>
        </div>
        <div>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] mx-4 text-center"
            onClick={() => setCategoryModalOpen(true)}
          >
            <Plus size={15} className="mr-1" /> Add Categories
          </Button>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center "
            onClick={() => {
              setEditProduct(null);
              setProductModalOpen(true);
            }}
          >
            <Plus size={15} className="mr-1" /> Add Products
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        caption="Products Available in Store"
        loading={loading}
        error={error}
        pageSize={10}
      />
    </div>
  );
}
