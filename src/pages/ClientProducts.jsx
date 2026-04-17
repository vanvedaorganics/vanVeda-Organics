import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ProductsGrid } from "../components";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";
import { fetchCategories } from "../store/categoriesSlice";
import { getImageUrl } from "../../utils/getImageUrl";
import { Tag } from "lucide-react";

function ClientProducts() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);
  const fetched = useSelector((state) => state.products.fetched);
  
  const categories = useSelector((state) => state.categories.items);
  const catLoading = useSelector((state) => state.categories.loading);

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

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Filter products based on category ID
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

  const activeCategoryName = categoryFilter === "all" 
    ? "All Harvest" 
    : categories.find(c => (c.$id || c.slug) === categoryFilter)?.name || "Category";

  return (
    <section className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-12 animate-fadeInUp">
      <div className="container mx-auto px-4">
        {/* Category Filter Icons (Dynamic) */}
        {!catLoading && categories.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-12">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`group flex flex-col items-center gap-2 transition-all ${
                categoryFilter === "all" ? "scale-110" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border-2 transition-all ${
                categoryFilter === "all" ? "border-[#28543d] bg-white shadow-lg" : "border-transparent"
              }`}>
                <Tag className="w-6 h-6 text-[#28543d]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#744531]">All</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.$id || cat.slug}
                onClick={() => handleCategoryClick(cat.$id || cat.slug)}
                className={`group flex flex-col items-center gap-2 transition-all ${
                  categoryFilter === (cat.$id || cat.slug) ? "scale-110" : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border-2 transition-all overflow-hidden ${
                  categoryFilter === (cat.$id || cat.slug) ? "border-[#28543d] shadow-lg" : "border-transparent"
                }`}>
                  {cat.imageId ? (
                    <img 
                      src={getImageUrl(cat.imageId)} 
                      alt={cat.name} 
                      className="w-10 h-10 object-contain p-1"
                    />
                  ) : (
                    <Tag className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#744531]">{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Heading */}
        <h1 className="syne-bold text-3xl md:text-4xl font-serif text-[#744531] text-center mb-12 relative">
          {activeCategoryName}
          <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#28543d] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
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
