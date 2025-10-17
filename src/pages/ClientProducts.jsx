import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ProductsGrid } from "../components";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";

function ClientProducts() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);
  const fetched = useSelector((state) => state.products.fetched);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const categoryFilter = searchParams.get("category") || "all";

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, fetched, loading]);

  // Filter products based on category string
  const filteredProducts = categoryFilter === "all" 
    ? products 
    : products.filter(p => p.categories === categoryFilter);

  const handleCategoryClick = (category) => {
    if (category === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <section className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-12 animate-fadeInUp">
      <div className="container">
        {/* Category Filter Icons */}
        <div className="flex justify-center items-center gap-6 mb-8">
          <button
            onClick={() => handleCategoryClick("mango")}
            className={`transition-transform hover:scale-110 ${
              categoryFilter === "mango" ? "ring-4 ring-[#69a72a] rounded-full" : ""
            }`}
            aria-label="Filter Mango Products"
          >
            <img 
              src="/mango.png" 
              alt="Mango" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
          </button>
          <button
            onClick={() => handleCategoryClick("ghee")}
            className={`transition-transform hover:scale-110 ${
              categoryFilter === "ghee" ? "ring-4 ring-[#69a72a] rounded-full" : ""
            }`}
            aria-label="Filter Ghee Products"
          >
            <img 
              src="/ghee.png" 
              alt="Ghee" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
          </button>
          {categoryFilter !== "all" && (
            <button
              onClick={() => handleCategoryClick("all")}
              className="px-4 py-2 text-sm font-medium text-white bg-[#69a72a] rounded-lg hover:bg-[#5a8f23] transition-colors"
            >
              Show All
            </button>
          )}
        </div>

        {/* Heading */}
        <h1 className="syne-bold text-3xl md:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative">
          {categoryFilter === "all" 
            ? "Our Organic Products" 
            : `Our ${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Products`}
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
            <ProductsGrid products={filteredProducts} />
            {filteredProducts.length === 0 && (
              <p className="text-center text-gray-500 mt-8">
                No products found in this category.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ClientProducts;
