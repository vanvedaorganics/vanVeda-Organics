import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ProductsGrid, ImageShowcase } from "../components";
import { Link } from "react-router-dom";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";

function Home() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    dispatch(fetchProducts()); // later: replace with featured query
  }, [dispatch]);

  // Pick a few hardcoded featured products for now
  const featuredProducts = products.filter((p) =>
    ["gir-kesar-mango", "shudh-desi-ghee"].includes(p.slug),
  );

  return (
    <>
      {/* ---------------- Hero Section ---------------- */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "clamp(420px, 70vh, 700px)" }}>
        {/* Background Image */}
        <img
          src="HeroImage.png"
          alt="True Soil Organics Hero"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
          loading="eager"
        />

        {/* Gradient overlay — strong at bottom, lighter at top for image visibility */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(20,16,8,0.92) 0%, rgba(20,16,8,0.55) 45%, rgba(20,16,8,0.18) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-20 flex h-full w-full items-end justify-center pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6"
          style={{ minHeight: "clamp(420px, 70vh, 700px)" }}>
          <div className="w-full max-w-3xl text-center">

            {/* Pill badge */}
            <span
              className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(231,206,157,0.18)", color: "#E7CE9D", border: "1px solid rgba(231,206,157,0.35)" }}
            >
              100% Certified Organic
            </span>

            {/* Main heading */}
            <h1
              className="syne-medium font-extrabold leading-tight tracking-tight text-white"
              style={{ fontSize: "clamp(1.75rem, 5vw, 4rem)", textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
            >
              Cultivating Health,
              <br className="hidden sm:block" />
              {" "}Nurturing Earth
            </h1>

            {/* Sub-text */}
            <p
              className="mx-auto mt-4 max-w-xl text-sm sm:text-base md:text-lg font-medium"
              style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              Your journey to pure, wholesome, and sustainable living with
              True Soil Organics starts here.
            </p>
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
        src={null}
        title="From Farm to Your Table"
        description="Witness the journey of our organic produce, grown with care and commitment to nature."
      />
    </>
  );
}

export default Home;
