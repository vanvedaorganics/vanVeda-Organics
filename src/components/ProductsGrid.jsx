import React from "react";
import ProductCard from "./ProductCard";

const ProductsGrid = ({ products = [] }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="
          grid gap-6 sm:gap-8
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        "
      >
        {products.map((product) => (
          <ProductCard key={product.$id} {...product} />
        ))}
      </div>
    </div>
  );
};

export default ProductsGrid;
