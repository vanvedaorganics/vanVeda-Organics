import React from "react";
import { Button, ProdcutGird, ProductCard, VideoShowcase } from "../components";
import { NavLink, Link } from "react-router-dom";

// const sampleProducts = [
//   {
//     name: "Organic Turmeric Powder",
//     slug: "organic-turmeric-powder",
//     image: "/images/products/turmeric.jpg",
//     description: "Premium quality organic turmeric powder for daily use.",
//     rating: 4.5,
//     reviews: 120,
//     price: 250,
//     packSizes: ["100g", "250g", "500g"],
//     discount: 10,
//   },
//   {
//     name: "Organic Honey",
//     slug: "organic-honey",
//     image: "/images/products/honey.jpg",
//     description: "Pure and natural organic honey sourced from local farms.",
//     rating: 4.8,
//     reviews: 80,
//     price: 400,
//     packSizes: ["250g", "500g"],
//     discount: 0,
//   },
//   {
//     name: "Organic Amla Powder",
//     slug: "organic-amla-powder",
//     image: "/images/products/amla.jpg",
//     description: "Rich in Vitamin C, ideal for immunity and hair care.",
//     rating: 4.2,
//     reviews: 45,
//     price: 300,
//     packSizes: ["100g", "200g"],
//     discount: 5,
//   },
//   {
//     name: "Organic Chia Seeds",
//     slug: "organic-chia-seeds",
//     image: "/images/products/chia.jpg",
//     description: "High-fiber superfood to boost energy and digestion.",
//     rating: 4.7,
//     reviews: 60,
//     price: 350,
//     packSizes: ["100g", "250g"],
//     discount: 0,
//   },
// ];

function Home() {
  return (
    <>
      {/* Unique Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="relative w-full h-full overflow-hidden bg-amber-950">
          <img
            src={null}
            alt="Van Veda Organics Hero"
            className="absolute inset-0 w-full h-full object-cover z-0 animate-fade-in"
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="max-w-4xl text-white space-y-6 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight syne-medium">
              Cultivating{" "}
              <span className="sacramento-semibold text-[#69A72A]">Health</span>
              , Nurturing{" "}
              <span className="sacramento-semibold text-[#69A72A]">Earth</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Your journey to pure, wholesome, and sustainable living with Van
              Veda Organics starts here.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <Button
                asChild
                size="lg"
                className="text-sm bg-[#E7CE9D] hover:bg-[#E7CE9D]/90 text-[#2D1D1A] rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
              >
                <Link href="/products">Explore Products</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white border-1 rounded-xl text-white hover:bg-white hover:text-[#2D1D1A] transition-colors transform hover:scale-105 duration-300 bg-transparent"
              >
                <Link href="/about-us">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Featured */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="container">
          <h2 className="syne-bold text-5xl text-center">
            Our Bestselling Organic Delights
          </h2>
          <div className="mt-12 text-center">
            <Button
              asChild
              size="lg"
              className="outline-[#2D1D1A] bg-[#2D1D1A] text-white text-sm py-3 px-8 rounded-xl shadow-md hover:shadow-lg"
            >
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Showcase */}
      <VideoShowcase
        src="/videos/organic-farm.mp4"
        title="From Farm to Your Table"
        description="Witness the journey of our organic produce, grown with care and commitment to nature."
      />

      {/* Unique "Our Organic Promise" Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
              <img
                src="/images/organic-promise.png"
                alt="Organic Promise"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
          </div>
          <div className="space-y-6 text-white">
            <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
              Our Unwavering Organic Promise
            </h2>
            <p className="text-lg leading-relaxed space-grotesk-regular text-[#613D38]">
              At Van Veda Organics, every product tells a story of purity,
              transparency, and responsibility. We partner with dedicated
              organic farmers who practice sustainable agriculture, ensuring
              that what reaches your home is not just food, but a legacy of
              health and environmental stewardship.
            </p>
            <ul className="list-disc list-inside space-y-2 text-md space-grotesk-regular test-[#613D38]">
              <li>Certified Organic Sourcing from trusted farms</li>
              <li>No Pesticides, No Chemicals, No GMOs</li>
              <li>Fair Practices for farmers and the environment</li>
              <li>Delivered Fresh, always with care</li>
            </ul>
            <Button
              asChild
              size="lg"
              className="bg-[#69A72A] hover:bg-[#69A72A]/90 text-white shadow-md hover:shadow-lg"
            >
              <Link href="/organic-certificates">Our Certifications</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Product Showcase - Recommended (different layout) */}
      {/* <section className="py-16 md:py-24 bg-muted">
        <div className="container">
          <h2 className="section-heading">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-48 w-48 rounded-full overflow-hidden mb-4 border-2 border-accent">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <h3 className="text-xl font-semibold font-serif mb-2">
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-primary">
                    ₹{product.price.toFixed(2)}
                  </span>
                </div>
                <Button className="mt-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section> */}
    </>
  );
}

export default Home;
