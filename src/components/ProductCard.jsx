import React from "react"
import { Star, Package } from "lucide-react"
import { Button } from "./index"
import { cn } from "../../utils/lib"

const ProductCard = ({
  name,
  slug,
  image,
  description,
  rating = 0,
  reviews = 0,
  price,
  packSizes = [],
  discount = 0,
  className
}) => {
  const hasMultiplePackSizes = packSizes && packSizes.length > 1
  const hasDiscount = discount > 0
  const discountedPrice = hasDiscount
    ? price - (price * discount) / 100
    : price

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white text-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative h-60 w-full overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasMultiplePackSizes && (
          <div className="absolute top-2 right-2 bg-green-900 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Sizes</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{description}</p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(rating)
                    ? "fill-green-900 text-green-900"
                    : "fill-gray-200 stroke-gray-400"
                }`}
              />
            ))}
          </div>
          <span>({reviews})</span>
        </div>

        {/* Price & Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              ₹{discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm line-through text-gray-500">
                ₹{price.toFixed(2)}
              </span>
            )}
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
