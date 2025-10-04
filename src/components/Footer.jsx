import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Input, Button } from "./index";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
} from "lucide-react";

function Footer() {
  return (
    <footer className="bg-[#2D1D1A] text-primary-foreground py-12 md:py-16 font-sans">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-6">
        {/* Brand Info */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img
              src="/VanVedaFooterLogo.jpg"
              width={150} /* Resized logo width */
              height={40} /* Resized logo height */
              alt="Van Veda Organics Logo"
              className="h-auto w-auto filter brightness-150" /* Adjust filter for visibility on dark background */
            />
          </Link>
          <p className="text-sm text-white/80">
            Van Veda Organics is committed to bringing you the purest organic
            products, sustainably sourced from nature's bounty.
          </p>
          <div className="flex space-x-4">
            <Link
              href="#"
              className="text-white hover:text-[#E7CE9D] transition-colors"
            >
              <Facebook className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-white hover:text-[#E7CE9D] transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-white hover:text-[#E7CE9D] transition-colors"
            >
              <Twitter className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-white hover:text-[#E7CE9D] transition-colors"
            >
              <Youtube className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#E7CE9D]">Quick Links</h3>
          <nav className="grid gap-2 text-sm text-white font-semibold">
            <Link
              to="/about-us"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/products"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              Shop Products
            </Link>
            <Link to="/blog" className="hover:text-[#E7CE9D] transition-colors">
              Blog
            </Link>
            <Link
              to="/certificates"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              Certificates
            </Link>
            <Link
              to="/faq"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>

        {/* Policies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#E7CE9D]">Policies</h3>
          <nav className="grid gap-2 text-sm text-white font-semibold">
            <Link
              to="/vanveda-policies"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              VanVeda Policies
            </Link>
            <Link
              to="/shipping-policy"
              className="hover:text-[#E7CE9D] transition-colors"
            >
              Shipping & Delivery Policy
            </Link>
          </nav>
        </div>

        {/* Contact & Newsletter */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#E7CE9D]">Contact Us</h3>
          <div className="space-y-2 text-sm text-white font-semibold">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> info@vanvedaorganics.com
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +91 12345 67890
            </p>
            <p className="text-primary-foreground/80">
              123 Organic Lane, Green City, State - 123456, India
            </p>
          </div>
          <h3 className="text-lg font-semibold text-[#E7CE9D] mt-6">
            Newsletter
          </h3>
          <form className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email"
              className="flex-1 bg-[#FFFFFF1A] border-white/60 text-white placeholder:text-white/60 focus:border-white  "
            />
            <Button
              type="submit"
              className="bg-[#E7CE9D] hover:bg-[#E7CE9D]/90 text-[#201314] cursor-pointer"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>
      <div className="container text-center text-sm text-white/60 mt-8 pt-8 border-t border-white/20">
        &copy; {new Date().getFullYear()} Van Veda Organics. All rights
        reserved.
      </div>
    </footer>
  );
}

export default Footer;
