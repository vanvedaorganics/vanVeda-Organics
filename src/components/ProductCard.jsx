import React from "react";
import { Star, Package } from "lucide-react";
import { Button } from "./index";
import { cn } from "../../utils/lib";
import { getImageUrl } from "../../utils/getImageUrl";

const ProductCard = ({
  name,
  slug,
  image_file_ids,
  description,
  rating = 0,
  reviews = 0,
  price_cents,
  currency = "INR",
  packSizes = [],
  discount = 0,
  className,
}) => {
  const hasMultiplePackSizes = packSizes && packSizes.length > 1;
  const hasDiscount = discount > 0;

  const price = price_cents / 100;
  const discountedPrice = hasDiscount
    ? price - (price * discount) / 100
    : price;

  const imageUrl = getImageUrl(image_file_ids);

  return (
    <div
      className={cn(
        "group relative max-w-sm mx-auto overflow-hidden rounded-xl border border-gray-100 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-[5/6] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        {hasMultiplePackSizes && (
          <div className="absolute top-2 right-2 bg-green-900 text-white px-2 py-1 rounded-full text-[10px] flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Sizes</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-semibold">
            {discount}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 border-t border-t-gray-100">
        <h3 className="text-base font-semibold line-clamp-1">{name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{description}</p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.floor(rating)
                    ? "fill-green-900 text-green-900"
                    : "fill-gray-200 stroke-gray-400"
                }`}
              />
            ))}
          </div>
          <span>({reviews})</span>
        </div>

        {/* Price + Button */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {currency} {discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through text-gray-500">
                {currency} {price.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
