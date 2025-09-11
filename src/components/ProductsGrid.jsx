import React from "react"
import ProductCard from "./ProductCard"

const ProductsGrid = ({ products = [] }) => {
  return (
    <div className="flex flex-wrap -mx-2">
      {products.map((product, idx) => (
        <div
          key={idx}
          className="
            w-full px-2 mb-4
            sm:w-1/2
            lg:w-1/3
            xl:w-1/4
          "
        >
          <ProductCard {...product} />
        </div>
      ))}
    </div>
  )
}

export default ProductsGrid
