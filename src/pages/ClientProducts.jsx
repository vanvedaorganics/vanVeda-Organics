import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
    <section className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-12 animate-fadeInUp">
      <div className="container">
        {/* Heading */}
        <h1 className="syne-bold text-3xl md:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative">
          Our Organic Products
          <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
        </h1>

        {/* Products */}
        {loading ? (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fadeInUp delay-200">
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
          <div className="animate-fadeInUp delay-300">
            <ProductsGrid products={products} />
          </div>
        )}
      </div>
    </section>
  );
}

export default ClientProducts;
