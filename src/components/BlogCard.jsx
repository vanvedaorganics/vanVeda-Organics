import React from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { cn } from "../../utils/lib";

const BlogCard = ({
  title,
  slug,
  image,
  excerpt,
  author = "Admin",
  publishDate,
  className,
}) => {
  return (
    <Link
      to={`/blog/${slug}`}
      className={cn(
        "group relative max-w-md mx-auto overflow-hidden rounded-2xl bg-white text-[#1a2e1a] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-[#E7CE9D]/20",
        className
      )}
    >
      {/* ── Image ────────────────────────────────────────── */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#faf8f4]">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-lg leading-tight font-bold syne-bold text-[#1a2e1a] group-hover:text-[#28543d] transition-colors line-clamp-2">
          {title}
        </h3>
        
        {excerpt && (
          <p className="text-sm leading-relaxed text-gray-500 line-clamp-3 font-medium">
            {excerpt}
          </p>
        )}

        {/* ── Meta Info ────────────────────────────────────── */}
        <div className="mt-2 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[#28543d]/60">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>{author}</span>
          </div>
          {publishDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{publishDate}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
