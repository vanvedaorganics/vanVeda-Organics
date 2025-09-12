import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { ShoppingCart, Menu, User, X } from "lucide-react";
import { Input } from "./index";
import { motion, AnimatePresence } from "framer-motion";
import appwriteService from "../appwrite/appwriteConfigService";
import { Query } from "appwrite";

export function Header() {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  const navItems = [
    { to: "/products", label: "PRODUCTS" },
    { to: "/certificates", label: "CERTIFICATES" },
    { to: "/blog", label: "BLOG" },
    { to: "/about-us", label: "ABOUT US" },
    { to: "/contact-us", label: "CONTACT US" },
  ];

  const navLinkClasses = ({ isActive }) =>
    `transition-colors hover:text-[#69A72A] ${
      isActive ? "text-green-900 font-semibold" : "text-gray-900"
    }`;

  useEffect(() => {
    setOfferLoading(true);
    appwriteService
      .getActiveAd()
      .then((res) => {
        appwriteService
          .listAds([Query.equal("$id", [res.activeAdId])])
          .then((res) => {
            setOffer(res.documents[0]?.description);
          });
      })
      .finally(setOfferLoading(false));
  }, []);

  return (
    <header className="w-full bg-white shadow-sm font-sans">
      {/* Top bar */}
      {offer !== null && (
        <div className="bg-[#69A72A] text-white text-center py-2 text-sm">
          {offerLoading ? (
            // Spinner loader
            <div role="status" className="flex justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            offer
          )}
        </div>
      )}

      {/* Main Header */}
      <motion.div
        className="max-w-7xl mx-auto flex h-16 md:h-20 items-center justify-between px-2 sm:px-4 md:px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-xl text-[#2D1D1A]"
          >
            Van Veda Organics
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <motion.div
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Input
            type="search"
            placeholder="Search products..."
            className="w-[200px] lg:w-[250px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-900 focus:ring-1 focus:ring-green-900"
          />
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex items-center gap-2 md:gap-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Cart */}
          <button className="relative hover:bg-gray-100 p-2 rounded-full">
            <ShoppingCart className="h-5 w-5 text-gray-900" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-900 text-xs text-white">
                {cartItemCount}
              </span>
            )}
            <span className="sr-only">Shopping Cart</span>
          </button>

          {/* Login */}
          <NavLink
            to="/my-account"
            className={({ isActive }) =>
              `hidden lg:flex items-center gap-1 text-sm font-medium transition-colors hover:text-green-900 ${
                isActive ? "text-green-900 font-semibold" : "text-gray-900"
              }`
            }
          >
            <User className="h-4 w-4" /> Login
          </NavLink>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden hover:bg-gray-100 p-2 rounded-full"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-900" />
            ) : (
              <Menu className="h-5 w-5 text-gray-900" />
            )}
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 p-6 shadow-lg flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-900 focus:ring-1 focus:ring-green-900"
              />
              <nav className="mt-6 flex flex-col gap-4 font-semibold">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `py-2 text-lg transition-colors hover:text-green-900 ${
                        isActive
                          ? "text-green-900 font-semibold"
                          : "text-gray-900"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/my-account"
                  className={({ isActive }) =>
                    `py-2 text-lg transition-colors hover:text-green-900 ${
                      isActive
                        ? "text-green-900 font-semibold"
                        : "text-gray-900"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </NavLink>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
