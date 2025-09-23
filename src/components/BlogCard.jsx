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
        "group relative max-w-md mx-auto overflow-hidden rounded-xl border border-gray-100 bg-white text-gray-900 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer",
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transform transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-4 border-t border-t-gray-100">
        <h3 className="text-lg syne-bold text-[#2D2D1A] line-clamp-2">
          {title}
        </h3>
        <p className="text-sm ubuntu-regular text-[#2D2D1A]/70 line-clamp-3 mt-1">
          {excerpt}
        </p>

        {/* Meta info */}
        <div className="ubuntu-regular mt-3 flex items-center justify-between text-xs text-[#2D2D1A]">
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{author}</span>
          </div>
          {publishDate && (
            <div className="flex items-center gap-1">
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
