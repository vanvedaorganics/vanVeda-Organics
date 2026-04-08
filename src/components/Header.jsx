// components/Header.jsx
import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  User,
  X,
  BookOpen,
  Info,
  Phone,
} from "lucide-react";
import { Input } from "./index";
import { motion, AnimatePresence } from "framer-motion";
import appwriteService from "../appwrite/appwriteConfigService";

import { Query } from "appwrite";
import { useDispatch, useSelector } from "react-redux";

import {
  setEmptyCart,
  selectCartTotalCount,
  selectCartItems,
  emptyUserCart,
} from "../store/cartsSlice";
import { CartCard } from "./index";

// ---- Helpers for new schema + cart keys ----
const parsePackagingSizes = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      try {
        const obj = typeof item === "string" ? JSON.parse(item) : item || {};
        return {
          size: obj?.size || "",
          price_cents:
            typeof obj?.price_cents !== "undefined"
              ? Number(obj.price_cents)
              : undefined,
          images: Array.isArray(obj?.images) ? obj.images.filter(Boolean) : [],
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const discountPrice = (cents, discount) => {
  const d = Number(discount) || 0;
  if (!cents || d <= 0) return cents || 0;
  return Math.round((cents * (100 - d)) / 100);
};

// cart key helpers: `${slug}::${sizeIdx}`
const CART_KEY_SEP = "::";
const parseCartKey = (key) => {
  if (!key || typeof key !== "string") return null;
  const idx = key.indexOf(CART_KEY_SEP);
  if (idx === -1) return { slug: key, sizeIdx: null }; // legacy key
  const slug = key.slice(0, idx);
  const sizeIdxStr = key.slice(idx + CART_KEY_SEP.length);
  const sizeIdx = Number.isNaN(Number(sizeIdxStr)) ? null : Number(sizeIdxStr);
  return { slug, sizeIdx };
};

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
      icon: <ShoppingCart className="h-5 w-5" />,
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
    {
      name: "Contact Us",
      slug: "/contact-us",
      icon: <Phone className="h-5 w-5" />,
      active: true,
    },
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
    `relative py-2 text-sm font-bold transition-all duration-300 tracking-tight group ${
      isActive ? "text-[#28543d]" : "text-[#744531] opacity-70 hover:opacity-100"
    }`;

  useEffect(() => {
    setOfferLoading(true);
    appwriteService
      .getActiveAd()
      .then((res) => {
        if (!res?.activeAdId) return;
        appwriteService
          .listAds([Query.equal("$id", [res.activeAdId])])
          .then((res2) => setOffer(res2.documents[0]?.description ?? null))
          .catch(() => setOffer(null));
      })
      .catch(() => setOffer(null))
      .finally(() => setOfferLoading(false));
  }, []);



  // Build cartProducts: per packaging size using composite keys
  // [{ cartKey, product, qty, sizeIdx, sizeLabel, unitCents, imageFileId, batch }]
  const cartProducts = useMemo(() => {
    if (!cartItems || !products) return [];
    return Object.entries(cartItems)
      .map(([key, itemData]) => {
        const parsed = parseCartKey(key);
        if (!parsed) return null;
        const product = products.find((p) => p.slug === parsed.slug);
        if (!product) return null;

        // Extract qty and batch from itemData (handle both legacy number and new object format)
        const qty =
          typeof itemData === "number" ? itemData : (itemData?.qty ?? 0);
        const batchData = typeof itemData === "object" ? itemData?.batch : null;

        const packaging = parsePackagingSizes(product.packaging_size);
        const sizeObj =
          typeof parsed.sizeIdx === "number" && packaging[parsed.sizeIdx]
            ? packaging[parsed.sizeIdx]
            : null;

        const baseCents =
          typeof sizeObj?.price_cents === "number"
            ? sizeObj.price_cents
            : typeof product.price_cents === "number"
              ? product.price_cents
              : 0;

        const unitCents = discountPrice(baseCents, product.discount || 0);

        const imageFileId =
          Array.isArray(sizeObj?.images) && sizeObj.images.length > 0
            ? sizeObj.images[0]
            : null;

        return {
          cartKey: key,
          product,
          qty,
          sizeIdx: typeof parsed.sizeIdx === "number" ? parsed.sizeIdx : null,
          sizeLabel: sizeObj?.size || null,
          unitCents,
          imageFileId,
          batch: batchData, // NEW: pass batch data
        };
      })
      .filter(Boolean);
  }, [cartItems, products]);

  // Subtotal calculation (per-size)
  const subtotal = useMemo(() => {
    return cartProducts.reduce(
      (acc, row) => acc + (row.unitCents / 100) * (row.qty || 0),
      0,
    );
  }, [cartProducts]);

  return (
    <header className="w-full bg-white shadow-[0_6px_10px_-2px_rgba(0,0,0,0.2)] border-b border-gray-200 font-sans">
      {/* Top bar */}
      {offer !== null && (
        <div className="bg-[#28543d] text-white text-center py-2 text-sm">
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
      {/* ── Desktop layout (lg+) ── */}
      <motion.div
        className="hidden lg:flex max-w-7xl mx-auto h-24 items-center gap-8 justify-between px-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex h-16 w-auto shrink-0 items-center overflow-hidden"
        >
          <img
            src="/Truesoil.png"
            alt="TrueSoil Organics"
            className="h-full w-auto object-contain transition-transform hover:scale-105 duration-300"
          />
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="flex items-center gap-8 xl:gap-10">
          {navItems.map((item) => {
            // Only show main nav items (exclude profile/login unless we specifically want them here)
            const isMainNav = !["Profile", "Login"].includes(item.name);
            return (
              item.active &&
              isMainNav && (
                <NavLink
                  key={item.slug}
                  to={item.slug}
                  className={navLinkClasses}
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#28543d] transition-all duration-300 group-hover:w-full" />
                </NavLink>
              )
            );
          })}
        </nav>

        {/* Right: Actions (Search, Profile/Login, Cart) */}
        <div className="flex items-center gap-4">
          <div className="relative group/search">
            <Input
              type="search"
              placeholder="Search..."
              className="w-48 xl:w-56 rounded-2xl border border-[#E7CE9D]/50 bg-[#faf8f4] px-4 py-2 text-xs focus:ring-1 focus:ring-[#28543d] focus:border-[#28543d] transition-all"
            />
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Login or Profile button */}
          {authStatus ? (
            <Link
              to="/profile"
              className="p-2 rounded-full hover:bg-[#28543d]/5 text-[#744531] transition-colors"
              title="Profile"
            >
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold uppercase tracking-widest text-[#744531] hover:text-[#28543d] transition-colors px-2"
            >
              Sign In
            </Link>
          )}

          {/* Cart Icon */}
          <motion.button
            onClick={() => setCartOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-2xl bg-[#744531] text-white shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E7CE9D] text-[10px] font-bold text-[#744531] border-2 border-white shadow-sm"
              >
                {cartItemCount}
              </motion.span>
            )}
          </motion.button>


        </div>
      </motion.div>

      {/* ── Mobile layout (< lg): Hamburger | Logo | Cart ── */}
      <motion.div
        className="lg:hidden flex h-16 items-center justify-between px-2 sm:px-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left: Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="hover:bg-gray-100 p-2 rounded-full"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-900" />
          ) : (
            <Menu className="h-5 w-5 text-gray-900" />
          )}
          <span className="sr-only">Toggle navigation menu</span>
        </button>

        {/* Center: Logo */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center"
        >
          <img
            src="/Truesoil.png"
            alt="TrueSoil Organics"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Right: Cart */}
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
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E7CE9D] text-[10px] font-bold text-[#744531] border border-white"
            >
              {cartItemCount}
            </motion.span>
          )}
          <span className="sr-only">Shopping Cart</span>
        </motion.button>
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 p-6 shadow-lg flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-2xl border border-[#E7CE9D]/50 bg-[#faf8f4] px-4 py-2.5 text-sm focus:ring-1 focus:ring-[#28543d] focus:border-[#28543d]"
              />

              {/* Product Category Icons */}
              <div className="mt-6 mb-6">
                <h3 className="text-xs font-bold text-[#744531] uppercase tracking-widest mb-4 opacity-60">
                  Shop by Category
                </h3>
                <div className="flex items-center justify-around gap-4 px-2">
                  <Link
                    to="/products?category=mango"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#E7CE9D]/10 flex items-center justify-center p-2 group-hover:bg-[#E7CE9D]/20 transition-colors">
                      <img
                        src="/mango.png"
                        alt="Mango"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#744531] uppercase tracking-tighter">Mango</span>
                  </Link>
                  <Link
                    to="/products?category=ghee"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#E7CE9D]/10 flex items-center justify-center p-2 group-hover:bg-[#E7CE9D]/20 transition-colors">
                      <img
                        src="/ghee.png"
                        alt="Ghee"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#744531] uppercase tracking-tighter">Ghee</span>
                  </Link>
                </div>
              </div>

              <nav className="mt-2 flex flex-col gap-2 font-semibold">
                {navItems.map(
                  (item) =>
                    item.active && (
                      <NavLink
                        key={item.slug}
                        to={item.slug}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                            isActive
                              ? "bg-[#28543d] text-white shadow-lg"
                              : "text-[#744531] hover:bg-[#28543d]/5"
                          }`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </NavLink>
                    ),
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
                    cartProducts.map((row) => (
                      <CartCard
                        key={row.cartKey}
                        product={row.product}
                        qty={row.qty}
                        cartKey={row.cartKey}
                        sizeIdx={row.sizeIdx}
                        sizeLabel={row.sizeLabel}
                        unitCents={row.unitCents}
                        imageFileId={row.imageFileId}
                        batch={row.batch}
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
                      navigate("/checkout");
                      setCartOpen(false);
                    }}
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#744531] hover:bg-[#744531]/90 text-white rounded-md"
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
                  cartProducts.map((row) => (
                    <CartCard
                      key={row.cartKey}
                      product={row.product}
                      qty={row.qty}
                      cartKey={row.cartKey}
                      sizeIdx={row.sizeIdx}
                      sizeLabel={row.sizeLabel}
                      unitCents={row.unitCents}
                      imageFileId={row.imageFileId}
                      batch={row.batch}
                    />
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
                    className="flex-1 py-2 px-4 ubuntu-medium bg-[#744531] hover:bg-[#744531]/90 text-white rounded-md"
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
