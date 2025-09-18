// components/ProductDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input } from "../components";
import { Star, Minus, Plus } from "lucide-react";
import { getImageUrl } from "../../utils/getImageUrl";
import {
  changeItemQuantity,
  addItemOne,
  removeItemCompletely,
  selectCartItems,
} from "../store/cartsSlice";

function ProductDetails() {
  const { slug } = useParams();
  const products = useSelector((state) => state.products.items);
  const authStatus = useSelector((state) => state.auth.status);
  const items = useSelector(selectCartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const quantity = Number(items[slug] || 0);

  useEffect(() => {
    if (products?.length > 0) {
      const found = products.find((p) => p.slug === slug);
      setProduct(found || null);
      setLoading(false);
    }
  }, [products, slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold text-gray-700">
        Product not found
      </div>
    );
  }

  const imageUrl = getImageUrl(product.image_file_ids);

  const ensureLoggedInThen = (cb) => {
    if (!authStatus || authStatus === false) {
      navigate(`/login?returnTo=/product/${slug}`);
      return;
    }
    cb();
  };

  const updateQty = (newQty) => {
    ensureLoggedInThen(() => {
      dispatch(changeItemQuantity({ slug, qty: Math.max(0, newQty) }));
    });
  };

  const onAddToCartClick = () => {
    ensureLoggedInThen(() => {
      if (quantity > 0) {
        dispatch(removeItemCompletely(slug));
      } else {
        dispatch(addItemOne(slug));
      }
    });
  };

  const inCart = quantity > 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 py-8 md:py-12 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-lg mb-4">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                onError={(e) => (e.target.src = "/placeholder.svg")}
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-6">
            <div>
              <h1 className="syne-bold text-3xl md:text-4xl text-[#201413]">
                {product.name}
              </h1>

              <div className="roboto-bold mt-4 text-3xl font-bold text-[#2D1D1A]">
                ₹
                {(product.discount > 0
                  ? product.price_cents / 100 -
                    (product.price_cents / 100) * (product.discount / 100)
                  : product.price_cents / 100
                ).toFixed(2)}
                {product.discount > 0 && (
                  <span className="ml-2 text-base text-[#613D38] line-through">
                    ₹{(product.price_cents / 100).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-[#2D1D1A] text-[#2D1D1A]"
                          : "fill-gray-300 stroke-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <span>({product.reviews || 0} reviews)</span>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="grid gap-2 mt-4">
              <h2 className="text-base font-semibold">Quantity:</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQty(quantity - 1)}
                  disabled={quantity <= 0}
                  className="hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    updateQty(Number.isNaN(Number(e.target.value)) ? 0 : e.target.value)
                  }
                  className="w-20 text-center text-[#201413] border focus:border-[#201413] focus:ring-[#201413]"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQty(quantity + 1)}
                  className="hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <Button
                size="lg"
                className={`flex-1 ${
                  inCart
                    ? "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                    : "bg-[#2D1D1A] hover:bg-[#2D1D1A]/90"
                } text-white shadow-md hover:shadow-lg transition-all duration-300`}
                onClick={onAddToCartClick}
              >
                {inCart ? "Remove From Cart" : "Add To Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 outline-[#2D1D1A] shadow-md hover:bg-[#e7ce9d] hover:shadow-lg transition-all duration-300 bg-transparent"
              >
                Buy Now
              </Button>
            </div>

            {/* Overview */}
            <div className="mt-6 border rounded-lg p-4 shadow-sm bg-white">
              <h2 className="syne-bold text-lg font-semibold mb-2">
                {product.name} Overview
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
