import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ProductsGrid, ImageShowcase } from "../components";
import { Link } from "react-router-dom";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";

function Home() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);

  useEffect(() => {
    dispatch(fetchProducts()); // later: replace with featured query
  }, [dispatch]);

  // Pick a few hardcoded featured products for now
  const featuredProducts = products.filter((p) =>
    ["gir-kesar-mango","shudh-desi-ghee"].includes(p.slug)
  );

  return (
    <>
      {/* ---------------- Hero Section ---------------- */}
      <section className="relative flex h-[600px] w-full items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative h-full w-full overflow-hidden">
          <img
            src="HeroImage.jpg"
            alt="Van Veda Organics Hero"
            className="absolute inset-0 z-0 h-full w-full animate-fade-in object-cover"
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-xs">
          <div className="max-w-4xl space-y-6 text-white animate-slide-up">
            <h1 className="syne-medium text-4xl font-bold md:text-7xl text-neutral-950">
              Cultivating Health
              , Nurturing Earth
            </h1>
            <p className="text-lg opacity-90 md:text-xl text-[#2D2D1A]">
              Your journey to pure, wholesome, and sustainable living with Van
              Veda Organics starts here.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-[#E7CE9D] text-sm text-[#2D1D1A] shadow-lg hover:scale-105 hover:bg-[#E7CE9D]/90"
              >
                <Link to="/products">Explore Products</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border border-white text-white hover:scale-105 hover:bg-white hover:text-[#2D1D1A]"
              >
                <Link to="/about-us">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Product Showcase ---------------- */}
      <section className="bg-gray-100 flex items-center justify-center bg-gradient-to-br from-background to-muted py-16 md:py-24">
        <div className="container">
          <h2 className="syne-bold text-center text-5xl mb-5">
            Our Bestselling Organic Delights
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
            <ProductsGrid products={featuredProducts} />
          )}

          <div className="mt-12 text-center">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-[#2D1D1A] px-8 py-3 text-sm text-white shadow-md hover:shadow-lg"
            >
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- Video Showcase ---------------- */}
      <ImageShowcase
        src=""
        title="From Farm to Your Table"
        description="Witness the journey of our organic produce, grown with care and commitment to nature."
      />
    </>
  );
}

export default Home;
