import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataTable,
  Button,
  CategoriesForm,
  Modal,
  ProductsForm,
} from "../components";
import { Image, Plus, Pencil, Trash2 } from "lucide-react";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { fetchProducts } from "../../src/store/productsSlice";
import conf from "../../src/conf/conf";

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

  // Define columns for DataTable
  const columns = [
    {
      header: "Preview",
      accessor: "image_file_ids",
      render: (row) => {
        const fileId = row.image_file_ids;
        if (!fileId || typeof fileId !== "string" || fileId.trim() === "") {
          return (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-400 rounded">
              <Image className="w-6 h-6" />
            </div>
          );
        }
        // Use /view endpoint for free plan
        const viewUrl = appwriteService.getFileViewUrl
          ? appwriteService.getFileViewUrl(fileId)
          : `${conf.appwriteUrl}/storage/buckets/${conf.appwriteBucketId}/files/${fileId}/view?project=${conf.appwriteProjectId}`;
        return (
          <img
            src={viewUrl}
            alt={row.name}
            className="w-12 h-12 object-cover rounded"
          />
        );
      },
    },
    { header: "Name", accessor: "name" },
    { header: "Slug", accessor: "slug" },
    { header: "Description", accessor: "description" },
    {
      header: "Price",
      accessor: "price_cents",
      render: (row) => `₹${(row.price_cents / 100).toFixed(2)}`,
    },
    { header: "Stock", accessor: "stock" },
    { header: "SKU", accessor: "sku" },
    {
      header: "Category",
      accessor: "categories",
      render: (row) => row.categories?.name || "—", // Appwrite will expand relationship
    },

    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            className="p-2 rounded hover:bg-blue-50 text-blue-600"
            onClick={() => {
              setEditProduct(row);
              setProductModalOpen(true);
            }}
          >
            <Pencil size={16} />
          </button>

          {/* Delete Button */}
          <button
            onClick={async () => {
              try {
                await appwriteService.deleteProduct(row.$id);
                console.log(`Product ${row.$id} deleted`);
              } catch (err) {
                console.error("Failed to delete product:", err);
              }
            }}
            className="p-2 rounded hover:bg-red-50 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
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
          if (!open) setEditProduct(null); // <-- Reset editProduct when modal closes
        }}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <ProductsForm
          onSuccess={() => {
            setProductModalOpen(false);
            setEditProduct(null);
          }}
          initialData={editProduct} // <-- Pass initialData for editing
        />
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
              setEditProduct(null); // <-- Ensure form is in "add" mode
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
