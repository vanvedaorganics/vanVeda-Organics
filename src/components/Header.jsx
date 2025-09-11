import React, { useState } from "react"
import { NavLink, Link } from "react-router-dom"
import { ShoppingCart, Menu, User, X } from "lucide-react"
import { Input } from "./index"

export function Header() {
  const [cartItemCount, setCartItemCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { to: "/products", label: "PRODUCTS" },
    { to: "/certificates", label: "CERTIFICATES" },
    { to: "/blog", label: "BLOG" },
    { to: "/about-us", label: "ABOUT US" },
    { to: "/contact-us", label: "CONTACT US" },
  ]

  const navLinkClasses = ({ isActive }) =>
    `transition-colors hover:text-[#69A72A] ${
      isActive ? "text-green-900 font-semibold" : "text-gray-900"
    }`

  return (
    <header className="w-full bg-white shadow-sm font-sans">
      {/* Top bar */}
      <div className="bg-[#69A72A] text-white text-center py-2 text-sm">
        Free Delivery on orders above ₹300 | Shop Now!
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto flex h-16 md:h-20 items-center justify-between px-2 sm:px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-[#2D1D1A]">
          Van Veda Organics
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
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
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white shadow-md px-4 py-6">
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
                    isActive ? "text-green-900 font-semibold" : "text-gray-900"
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
                  isActive ? "text-green-900 font-semibold" : "text-gray-900"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
