import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ProductsGrid } from "../components";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";

function ClientProducts() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);

  useEffect(() => {
    dispatch(fetchProducts()); // later: replace with featured query
  }, [dispatch]);

  return (
    <section className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-24">
      <div className="container">
        <h2 className="syne-bold text-center text-5xl mb-5">
          Our Organic Products
        </h2>

        {loading ? (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[350px] w-full rounded-lg bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </div>
    </section>
  );
}

export default ClientProducts;
