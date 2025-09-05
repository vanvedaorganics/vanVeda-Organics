import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataTable, Button } from "../components";
import { Image, Plus, Pencil, Trash2 } from "lucide-react";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { fetchProducts } from "../../src/store/productsSlice";
import Modal from "../components/Modal";
import CategoriesForm from "../components/CategoriesForm";

export default function ProductsPage() {
  const dispatch = useDispatch();
  const {
    items: products,
    loading,
    error,
  } = useSelector((state) => state.products);

  // Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Define columns for DataTable
  const columns = [
    {
      header: "Preview",
      accessor: "image_file_ids",
      render: (row) => {
        const fileId = Array.isArray(row.image_file_ids)
          ? row.image_file_ids[0]
          : row.image_file_ids;

        if (!fileId) {
          return (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-400 rounded">
              <Image className="w-6 h-6" />
            </div>
          );
        }

        // Get preview URL from Appwrite
        const previewUrl = appwriteService.getfilePreview(fileId);

        return (
          <img
            src={previewUrl}
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
      accessor: "category",
      render: (row) => row.category || "—",
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            onClick={() => console.log("Edit", row.$id)}
            className="p-2 rounded hover:bg-blue-50 text-blue-600"
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
    if (!products || products.length === 0) {
      dispatch(fetchProducts()); // only fetch once if store is empty
    }
  }, [dispatch, products]);

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
