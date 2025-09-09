import React, { useState, useMemo } from "react";
import { Button, OfferCard, ProductOfferModal, CardGrid } from "../components";
import { Plus } from "lucide-react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Offers page:
 * - shows cards for all products that currently have discount > 0
 * - "Add Offers" opens modal to add a new offer
 * - Edit button on card opens modal to edit that offer
 */

export default function Offers() {
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const products = useSelector((s) => s.products.items || []);

  // memoize discounted items to avoid re-computations + unnecessary re-renders
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">Offers Management</h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Upload and Manage your products' offers here
          </h2>
        </div>

        <div>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center"
            onClick={openAddModal}
          >
            <Plus size={15} className="mr-1" /> Add Offers
          </Button>
        </div>
      </div>

      <CardGrid className="mt-6">
        {discounted.length > 0 ? (
          <AnimatePresence initial={false}>
            {discounted.map((p) => (
              <motion.div
                key={p.$id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <OfferCard product={p} onEdit={handleEdit} />
              </motion.div>
            ))}
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
