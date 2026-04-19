import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, ProductsGrid, ImageShowcase, BlogCard } from "../components";
import { Link } from "react-router-dom";
import { fetchProducts, selectAllProducts } from "../store/productsSlice";
import { fetchCategories } from "../store/categoriesSlice";
import { motion } from "framer-motion";
import { Leaf, Globe, Truck, CheckCircle, Quote, ArrowRight, Tag } from "lucide-react";
import blogData from "./Blog/blogData";
import { getImageUrl } from "../../utils/getImageUrl";

function Home() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector((state) => state.products.loading);
  const categories = useSelector((state) => state.categories.items);
  const catLoading = useSelector((state) => state.categories.loading);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Dynamically pick products marked as bestsellers in the admin panel
  const featuredProducts = useMemo(() => {
    const bestsellers = products.filter((p) => p.isBestseller === true);
    // Fallback: If no bestsellers marked, show the previous hardcoded ones or first 4
    if (bestsellers.length === 0) {
      return products.filter((p) =>
        ["gir-kesar-mango", "shudh-desi-ghee", "forest-honey", "organic-haldi"].includes(p.slug)
      ).slice(0, 4);
    }
    return bestsellers.slice(0, 4);
  }, [products]);

  const latestBlogs = useMemo(() => blogData.slice(0, 3), []);

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "clamp(480px, 85vh, 850px)" }}>
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="HeroImage.png"
          alt="True Soil Organics Hero"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="relative z-20 flex h-full w-full items-center justify-center px-6 pt-20"
          style={{ minHeight: "clamp(480px, 85vh, 850px)" }}>
          <div className="w-full max-w-4xl text-center">
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6 inline-block rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-[#E7CE9D]/10 text-[#E7CE9D] border border-[#E7CE9D]/30 backdrop-blur-md"
            >
              100% Pure & Organic • Soil to Soul
            </motion.span>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="syne-bold font-black leading-[1.1] tracking-tight text-white mb-6"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}
            >
              Purely Organic,<br />Truly Soulful.
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl font-medium text-white/90 mb-10"
            >
              Discover the richness of nature through our sustainably harvested products, 
              delivered straight from our farms to your doorstep.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="rounded-full bg-[#E7CE9D] text-[#744531] font-bold px-10 h-14 hover:bg-white transition-all shadow-xl shadow-[#E7CE9D]/10">
                <Link to="/products">Explore Harvest</Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full border-white/30 bg-white/5 text-white backdrop-blur-md px-10 h-14 hover:bg-white/10 transition-all">
                <Link to="/about-us">Our Story</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Trust Badges ─────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Leaf, title: "100% Organic", desc: "Non-GMO & Pure" },
              { icon: Globe, title: "Sustainable", desc: "Eco-friendly farms" },
              { icon: Truck, title: "Direct to Table", desc: "Fresh from harvest" },
              { icon: CheckCircle, title: "Purely Natural", desc: "No artificial additives" }
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#faf8f4] flex items-center justify-center mb-4 group-hover:bg-[#E7CE9D]/10 transition-colors duration-500">
                  <feature.icon className="w-6 h-6 text-[#744531]" />
                </div>
                <h3 className="text-sm font-black text-[#744531] uppercase tracking-wider mb-1">{feature.title}</h3>
                <p className="text-[11px] text-gray-400 font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Category Showcase ────────────────────────────────────────── */}
      {(categories.length > 0 || catLoading) && (
        <section className="py-24 bg-[#faf8f4]/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E7CE9D] mb-2 block">Our Harvest</span>
              <h2 className="syne-bold text-4xl md:text-5xl text-[#744531]">Browse by Category</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {catLoading ? (
                 Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse" />
                ))
              ) : (
                categories.map((cat, idx) => (
                  <Link 
                    key={cat.$id || cat.slug} 
                    to={`/products?category=${cat.$id}`}
                    className="group"
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative h-48 bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-[#744531]/5 hover:-translate-y-2 group"
                    >
                      <div className="w-20 h-20 mb-4 rounded-2xl bg-[#faf8f4] flex items-center justify-center group-hover:bg-[#E7CE9D]/10 transition-colors duration-500 overflow-hidden">
                        {cat.imageId ? (
                          <img 
                            src={getImageUrl(cat.imageId)} 
                            alt={cat.name} 
                            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          <Tag className="w-8 h-8 text-[#E7CE9D]" />
                        )}
                      </div>
                      <h3 className="syne-bold text-lg text-[#744531] group-hover:text-[#28543d] transition-colors">{cat.name}</h3>
                      <div className="mt-2 w-0 h-0.5 bg-[#E7CE9D] group-hover:w-8 transition-all duration-500" />
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}
      {/* ── 4. Product Showcase (Bestsellers) ────────────────────────────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E7CE9D] mb-2 block">Bestsellers</span>
            <h2 className="syne-bold text-4xl md:text-5xl text-[#744531]">Crafted by Nature</h2>
          </div>

          {loading ? (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] w-full rounded-[2.5rem] bg-[#faf8f4] animate-pulse" />
              ))}
            </div>
          ) : (
            <ProductsGrid products={featuredProducts} />
          )}

          <div className="mt-16 text-center">
            <Link to="/products">
              <Button size="lg" className="rounded-full bg-[#744531] px-12 h-14 text-sm tracking-widest text-white shadow-xl hover:bg-[#28543d] transition-all">
                Shop All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* ── 6. Stories & Insights ─────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E7CE9D] mb-2 block">Journal</span>
              <h2 className="syne-bold text-4xl md:text-5xl text-[#744531]">Stories & Insights</h2>
            </div>
            <Link to="/blog" className="text-sm font-black uppercase tracking-widest text-[#28543d] hover:text-[#744531] flex items-center gap-2 transition-all">
              Read All Stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {latestBlogs.map((blog, idx) => (
               <BlogCard key={idx} {...blog} />
             ))}
          </div>
        </div>
      </section>

      {/* ── 5. Testimonials ────────────────────────────────────────── */}
      <section className="py-24 bg-[#744531] text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-16">
            <Quote className="w-12 h-12 text-[#E7CE9D]/40 mb-6" />
            <h2 className="syne-bold text-4xl md:text-5xl mb-4">What Our Community Says</h2>
            <p className="text-[#E7CE9D] max-w-xl text-sm tracking-wide">Join thousands of families living the soulful organic lifestyle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Anjali Sharma", text: "The Giri Kesar Mangoes are a world apart. You can truly taste the Gir soil in every bite. Pure heaven!", role: "Health Enthusiast" },
              { name: "Sameer Vora", text: "Finally found Ghee that smells like Home. True soil Organics's commitment to quality is evident from the first use.", role: "Professional Chef" },
              { name: "Priya Mehta", text: "Sustainable, organic, and truly effective. The honey from the forest section is my morning ritual now.", role: "Yoga Practitioner" }
            ].map((t, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/10 hover:bg-white/10 transition-all duration-500">
                <p className="italic text-lg mb-8 text-white/90 leading-relaxed font-light">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E7CE9D]/20 flex items-center justify-center text-[10px] font-black uppercase text-[#E7CE9D]">
                    {t.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{t.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#E7CE9D] font-bold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
