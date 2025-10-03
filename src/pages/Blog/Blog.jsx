import React from "react";
import { motion } from "framer-motion";
import { BlogCard } from "../../components";
import blogData from "./blogData";

// Variants for reusable fade-in-up animation
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function Blog() {
  return (
    <motion.div
      className="container py-8 md:py-12 font-sans"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeInUp}
    >
      {/* Page Heading */}
      <motion.h1
        className="syne-bold text-3xl md:text-4xl font-serif text-[#2d1d1a] text-center mb-12 relative"
        variants={fadeInUp}
      >
        VanVeda Blogs
        <span className="absolute left-1/2 -bottom-2 w-16 h-1 bg-[#69a72a] rounded-full transform -translate-x-1/2 animate-expandLine"></span>
      </motion.h1>


      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {blogData.map((blog) => (
           <BlogCard 
          title={blog.title}
          slug={blog.slug}
          image={blog.image}
          excerpt={blog.excerpt}
          author={blog.author}
          publishDate={blog.publishDate}
        />
        ))
       }
      </section>
    </motion.div>
  );
}

export default Blog;
