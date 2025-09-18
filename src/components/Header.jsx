import React, { useState, useEffect } from "react";
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
import { setEmptyCart } from "../store/cartsSlice";
import { selectCartTotalCount } from "../store/cartsSlice";

export function Header() {
  const cartItemCount = useSelector(selectCartTotalCount);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offerLoading, setOfferLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);

  // nav items follow the sample file logic
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
          <button className="relative hover:bg-gray-100 p-2 rounded-full">
            <ShoppingCart className="h-5 w-5 text-gray-900" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e7ce9d] text-xs text-[#2D1D1A]">
                {cartItemCount}
              </span>
            )}
            <span className="sr-only">Shopping Cart</span>
          </button>

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
    </header>
  );
}

export default Header;
