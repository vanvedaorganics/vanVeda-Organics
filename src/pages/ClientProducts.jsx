import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ProductsGrid } from "../components";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";

function ClientProducts() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);
  const fetched = useSelector((state) => state.products.fetched);

  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, fetched, loading]);

  return (
    <motion.section
      className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-24"
      initial={{ opacity: 0, y: 30 }}        // start state
      animate={{ opacity: 1, y: 0 }}         // animate to
      exit={{ opacity: 0, y: -30 }}          // when navigating away (if using AnimatePresence)
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container">
        <h2 className="syne-bold text-center text-5xl mb-10">
          Our Organic Products
        </h2>

        {loading ? (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white shadow animate-pulse"
              >
                <div className="h-40 bg-gray-200 rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-9 bg-gray-200 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </div>
    </motion.section>
  );
}

export default ClientProducts;
