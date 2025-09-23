import React from "react";
import { useParams, Link } from "react-router-dom";
import blogData from "./blogData";
import { Calendar, User } from "lucide-react";
import { Button } from "../../components";

const BlogDetail = () => {
  const { slug } = useParams();

  // Find the blog post by slug
  const post = blogData.find((b) => b.slug === slug);

  if (!post) {
    return (
      <div className="container py-8 md:py-12 font-sans text-center text-red-600">
        Blog post not found.
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 font-sans">
      <article className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
        {/* Breadcrumb */}
        <div className="ubuntu-regular text-sm text-[#2D2D1A]/70 mb-4">
          <Link to="/blog" className="hover:underline">
            Blog
          </Link>{" "}
          / {post.title}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl syne-bold mb-4 text-[#2D2D1A] leading-tight">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="ubuntu-regular flex items-center text-sm text-[#2D2D1A]/70 mb-6 gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {post.publishDate}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" /> {post.author}
          </span>
        </div>

        {/* Image */}
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8 shadow-md">
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="ubuntu-regular max-w-none text-[#2d1d1a]/80 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </article>

      {/* CTA Section */}
      <section className="mt-16 text-center bg-[#e7ce9d]/20 p-8 rounded-lg shadow-inner max-w-3xl mx-auto">
        <h2 className="text-3xl syne-bold text-[#2d1d1a] mb-4">
          Continue Your Organic Journey
        </h2>
        <p className="ubuntu-regular text-[#2D2D1A]/70 mb-6">
          Explore more articles, discover new products, or connect with our
          community.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            className="bg-[#69A72A] hover:bg-[#69A728]/90 text-white"
          >
            <Link to="/blog">More Blog Posts</Link>
          </Button>
          <Button asChild variant="outline" className="hover:bg-[#e7ce9d]">
            <Link to="/products">Shop Organic Products</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;
