import React, { useState, useEffect } from "react";
import authService from "../../src/appwrite/authService";
import { login, logout } from "../../src/store/authSlice";
import { useDispatch } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  Package,
  Users,
  ShoppingCart,
  Megaphone,
  Tag,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getUser()
      .then((userData) => {
        if (userData && userData.$id) {
          authService.isAdmin().then((isAdmin) => {
            if (isAdmin) {
              dispatch(login({ user: userData }));
            } else {
              dispatch(logout());
            }
            setLoading(false);
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const userLogout = async () => {
    authService.logout().then(() => {
      dispatch(logout());
      navigate("/admin/login");
      console.log("[Logout] Success");
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#084629] text-white transition-transform duration-300 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0`}
      >
        <div className="space-grotesk-bold p-4 text-xl font-bold border-b border-green-900 flex items-center gap-3">
          <Package color="black" className="bg-[#dfb96a] rounded-md" />
          VanVed Organics
          <X
            className="md:hidden  transition-transform duration-300 active:scale-90 active:text-gray-400"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <nav className="space-grotesk-medium mt-4 flex flex-col space-y-2 p-4 text-sm">
          <Link
            to="/admin/products"
            className="px-3 py-2 rounded hover:bg-green-800 flex items-center gap-3"
          >
            <Package size={15} />
            Products
          </Link>
          <Link
            to="/admin/users"
            className="px-3 py-2 rounded hover:bg-green-800 flex items-center gap-3"
          >
            <Users size={15} />
            Users
          </Link>
          <Link
            to="/admin/orders"
            className="px-3 py-2 rounded hover:bg-green-800 flex items-center gap-3"
          >
            <ShoppingCart size={15} />
            Orders
          </Link>
          <Link
            to="/admin/ads"
            className="px-3 py-2 rounded hover:bg-green-800 flex items-center gap-3"
          >
            <Megaphone size={15} />
            Advertisements
          </Link>
          <Link
            to="/admin/offers"
            className="px-3 py-2 rounded hover:bg-green-800 flex items-center gap-3"
          >
            <Tag size={15} />
            Offers
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#084629] space-grotesk-bold">
                VanVeda Admin
              </h1>
              <h2 className="spac-grotesk-medium text-gray-800">
                Manage Your Store
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700">Admin</span>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={userLogout}
            >
              <LogOut className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-y-auto">
          {!loading ? <Outlet /> : <p>Loading...</p>}
        </main>
      </div>
    </div>
  );
}
