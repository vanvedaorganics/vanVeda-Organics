import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataTable,
  Button,
  CategoriesForm,
  Modal,
} from "../components";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { 
  fetchCategories, 
  deleteCategory as deleteCategoryInStore 
} from "../../src/store/categoriesSlice";
import { getImageUrl } from "../../utils/getImageUrl";
import { toast } from "sonner";

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const { items: categories, loading, error } = useSelector((state) => state.categories);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleEdit = (category) => {
    setEditCategory(category);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditCategory(null);
    setModalOpen(true);
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this category? All products using it will no longer show it in filtering.")) return;
    
    setDeletingId(slug);
    try {
      await appwriteService.deleteCategory(slug);
      dispatch(deleteCategoryInStore(slug));
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error("Failed to delete category");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: "Icon",
      accessor: "imageId",
      render: (imageId) => (
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
          {imageId ? (
            <img 
              src={getImageUrl(imageId)} 
              alt="Icon" 
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-300" />
          )}
        </div>
      ),
    },
    {
      header: "Category Name",
      accessor: "name",
      render: (name) => <span className="font-bold text-[#084629]">{name}</span>,
    },
    {
      header: "Slug",
      accessor: "slug",
      render: (slug) => <code className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-mono text-gray-500 uppercase tracking-tighter">{slug}</code>,
    },
    {
      header: "Actions",
      accessor: (row) => row,
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0 rounded-lg hover:bg-[#dfb96a]/10 hover:border-[#dfb96a] text-gray-600 border-gray-200"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.$id || row.slug)}
            disabled={deletingId === (row.$id || row.slug)}
            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:border-red-200 text-gray-600 border-gray-200"
          >
            {deletingId === (row.$id || row.slug) ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#084629] flex items-center justify-center text-white shadow-lg shadow-[#084629]/10">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#084629] tracking-tight">Categories</h1>
            <p className="text-sm text-gray-500 font-medium">Define your store sections and icons</p>
          </div>
        </div>
        <Button
          onClick={handleAddNew}
          className="rounded-xl px-6 h-12 bg-[#dfb96a] text-[#084629] font-bold shadow-lg shadow-[#dfb96a]/10 flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Category
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Loader2 className="animate-spin w-8 h-8 text-[#dfb96a]" />
            <p className="text-sm font-medium">Fetching categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
               <Tag size={32} />
            </div>
            <div>
              <p className="font-bold text-gray-900">No categories yet</p>
              <p className="text-sm text-gray-500">Create categories to organize your products</p>
            </div>
          </div>
        ) : (
          <DataTable columns={columns} data={categories} />
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editCategory ? "Edit Category" : "New Category"}
          onClose={() => setModalOpen(false)}
        >
          <div className="p-1">
            <CategoriesForm
              initialData={editCategory}
              onSuccess={() => {
                setModalOpen(false);
                dispatch(fetchCategories());
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
