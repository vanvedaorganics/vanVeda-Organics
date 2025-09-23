// components/Header.jsx
import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  User,
  X,
  Package,
  Award,
  BookOpen,
  Info,
  Phone,
} from "lucide-react";
import { Input } from "./index";
import { motion, AnimatePresence } from "framer-motion";
import appwriteService from "../appwrite/appwriteConfigService";
import appwriteAuthService from "../appwrite/authService";
import { Query } from "appwrite";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../store/authSlice";
import {
  setEmptyCart,
  selectCartTotalCount,
  selectCartItems,
  emptyUserCart,
} from "../store/cartsSlice";
import { CartCard } from "./index";

export function Header() {
  const cartItemCount = useSelector(selectCartTotalCount);
  const cartItems = useSelector(selectCartItems);
  const products = useSelector((state) => state.products.items);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);

  const navItems = [
    {
      name: "Products",
      slug: "/products",
      icon: <Package className="h-5 w-5" />,
      active: true,
    },
    {
      name: "Certificates",
      slug: "/certificates",
      icon: <Award className="h-5 w-5" />,
      active: true,
    },
    {
      name: "Blog",
      slug: "/blog",
      icon: <BookOpen className="h-5 w-5" />,
      active: true,
    },
    {
      name: "About Us",
      slug: "/about-us",
      icon: <Info className="h-5 w-5" />,
      active: true,
    },
    // {
    //   name: "Contact Us",
    //   slug: "/contact-us",
    //   icon: <Phone className="h-5 w-5" />,
    //   active: true,
    // },
    {
      name: "Profile",
      slug: "/profile",
      icon: <User className="h-5 w-5" />,
      active: authStatus,
    },
    {
      name: "Login",
      slug: "/login",
      icon: <User className="h-5 w-5" />,
      active: !authStatus,
    },
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
        if (!res?.activeAdId) return;
        appwriteService
          .listAds([Query.equal("$id", [res.activeAdId])])
          .then((res2) => {
            setOffer(res2.documents[0]?.description ?? null);
          })
          .catch(() => setOffer(null));
      })
      .catch(() => setOffer(null))
      .finally(() => setOfferLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await appwriteAuthService.logout();
      dispatch(logoutAction());
      dispatch(setEmptyCart());
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Build cartProducts array: [{ product, qty }]
  const cartProducts = useMemo(() => {
    if (!cartItems || !products) return [];
    return Object.entries(cartItems)
      .map(([slug, qty]) => {
        const product = products.find((p) => p.slug === slug);
        if (!product) return null;
        return { product, qty: Number(qty || 0) };
      })
      .filter(Boolean);
  }, [cartItems, products]);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cartProducts.reduce((acc, { product, qty }) => {
      const price =
        product.discount > 0
          ? product.price_cents / 100 -
            (product.price_cents / 100) * (product.discount / 100)
          : product.price_cents / 100;
      return acc + price * qty;
    }, 0);
  }, [cartProducts]);

  return (
    <header className="w-full bg-white shadow-[0_6px_10px_-2px_rgba(0,0,0,0.2)] border-b border-gray-200 font-sans">
      {/* Top bar */}
      {offer !== null && (
        <div className="bg-[#69A72A] text-white text-center py-2 text-sm">
          {offerLoading ? (
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
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-xl text-[#2D1D1A]"
        >
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
            {navItems.map(
              (item) =>
                item.active && (
                  <NavLink
                    key={item.slug}
                    to={item.slug}
                    className={navLinkClasses}
                  >
                    {item.name}
                  </NavLink>
                )
            )}
            {authStatus && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-900 hover:text-green-900"
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Cart */}
          <motion.button
            onClick={() => setCartOpen(true)}
            whileHover={{ scale: 1.1, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5 text-gray-900" />
            {cartItemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e7ce9d] text-xs text-[#2D1D1A] shadow-sm"
              >
                {cartItemCount}
              </motion.span>
            )}
            <span className="sr-only">Shopping Cart</span>
          </motion.button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden hover:bg-gray-100 p-2 rounded-full"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-900" />
            ) : (
              <Menu className="h-5 w-5 text-gray-900" />
            )}
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
      </motion.div>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

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
              <nav className="mt-6 flex flex-col gap-2 font-semibold">
                {navItems.map(
                  (item) =>
                    item.active && (
                      <NavLink
                        key={item.slug}
                        to={item.slug}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-md px-3 py-2 text-lg transition-colors ${
                            isActive
                              ? "bg-green-100 text-green-900 font-semibold"
                              : "text-gray-900 hover:text-green-900"
                          }`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </NavLink>
                    )
                )}
                {authStatus && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-lg text-gray-900 hover:text-green-900 text-left"
                  >
                    <X className="h-5 w-5" /> Sign Out
                  </button>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sidebar / Page */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />

            {/* Desktop Sidebar */}
            <motion.div
              className="hidden lg:flex fixed top-0 right-0 bottom-0 w-[38%] bg-white z-50 shadow-lg flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Scrollable Cart Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-xl syne-bold mb-4 text-[#2D2D1A]">
                  Your Cart
                </h2>

                <div className="space-y-4">
                  {cartProducts.length === 0 ? (
                    <p className="text-gray-500">Cart items go here...</p>
                  ) : (
                    cartProducts.map(({ product, qty }) => (
                      <CartCard
                        key={product.slug}
                        product={product}
                        qty={qty}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Footer Section */}
              <div className="p-4 border-t bg-white flex flex-col gap-2">
                <div className="flex justify-between ubuntu-bold text-lg text-[#2D2D1A]">
                  <span>Total:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch(emptyUserCart());
                      dispatch(setEmptyCart());
                    }}
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#E7CE9D] hover:bg-[#E7CE9D]/90 rounded-md text-[#2D2D1A]"
                  >
                    Empty Cart
                  </button>
                  <button
                    onClick={() => {
                      // navigate to checkout or handle checkout flow
                      navigate("/checkout");
                      setCartOpen(false);
                    }}
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#2D1D1A] hover:bg-[#2D1D1A]/90 text-white rounded-md"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Mobile Full Page */}
            <motion.div
              className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button onClick={() => setCartOpen(false)}>
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              {/* Scrollable Cart Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartProducts.length === 0 ? (
                  <p className="text-gray-500">Cart items go here...</p>
                ) : (
                  cartProducts.map(({ product, qty }) => (
                    <CartCard key={product.slug} product={product} qty={qty} />
                  ))
                )}
              </div>

              {/* Footer Section */}
              <div className="p-4 border-t flex flex-col gap-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch(emptyUserCart());
                      dispatch(setEmptyCart());
                    }}
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#E7CE9D] hover:bg-[#E7CE9D]/90 rounded-md text-[#2D2D1A]"
                  >
                    Empty Cart
                  </button>
                  <button
                    onClick={() => {
                      navigate("/checkout");
                      setCartOpen(false);
                    }}
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#2D1D1A] hover:bg-[#2D1D1A]/90 text-white rounded-md"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
