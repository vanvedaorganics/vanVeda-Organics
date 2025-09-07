import React, { useState, useEffect } from "react";
import authService from "../../src/appwrite/authService";
import { login, logout } from "../../src/store/authSlice";
import { Toaster } from "sonner";
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
import { NavLink } from "react-router-dom";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUsername] = useState(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getUser()
      .then((userData) => {
        if (userData && userData.$id) {
          authService.isAdmin().then((isAdmin) => {
            if (isAdmin) {
              dispatch(login(userData));
              setUsername(userData.name)
            } else {
              dispatch(logout());
            }
            setLoading(false);
          });
        }
      })
      .finally(() => setLoading(false));
  });

  const userLogout = async () => {
    authService.logout().then(() => {
      dispatch(logout());
      setUsername(null)
      navigate("/admin/login");
      console.log("[Logout] Success");
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
       <Toaster richColors position="top-right" />
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#084629] text-white transition-transform duration-300 z-10 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0`}
      >
        <div className="space-grotesk-bold p-4 text-xl font-bold border-b border-green-900 flex items-center gap-3">
          <Package color="#084629" className="bg-[#dfb96a] rounded-md" />
          VanVed Organics
          <X
            className="md:hidden  transition-transform duration-300 active:scale-90 active:text-gray-400"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <nav className="space-grotesk-medium mt-4 flex flex-col space-y-2 p-4 text-sm">
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `px-3 py-2 rounded flex items-center gap-3 ${
                isActive
                  ? "bg-[#dfb96a] text-[#084629] font-bold"
                  : "hover:bg-green-800 active:bg-[#dfb96a] active:text-[#084629]"
              }`
            }
          >
            <Package size={15} />
            Products
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `px-3 py-2 rounded flex items-center gap-3 ${
                isActive
                  ? "bg-[#dfb96a] text-[#084629] font-bold"
                  : "hover:bg-green-800"
              }`
            }
          >
            <Users size={15} />
            Users
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `px-3 py-2 rounded flex items-center gap-3 ${
                isActive
                  ? "bg-[#dfb96a] text-[#084629] font-bold"
                  : "hover:bg-green-800"
              }`
            }
          >
            <ShoppingCart size={15} />
            Orders
          </NavLink>
          <NavLink
            to="/admin/ads"
            className={({ isActive }) =>
              `px-3 py-2 rounded flex items-center gap-3 ${
                isActive
                  ? "bg-[#dfb96a] text-[#084629] font-bold"
                  : "hover:bg-green-800"
              }`
            }
          >
            <Megaphone size={15} />
            Advertisements
          </NavLink>
          <NavLink
            to="/admin/offers"
            className={({ isActive }) =>
              `px-3 py-2 rounded flex items-center gap-3 ${
                isActive
                  ? "bg-[#dfb96a] text-[#084629] font-bold"
                  : "hover:bg-green-800"
              }`
            }
          >
            <Tag size={15} />
            Offers
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between bg-white  px-4 py-3 inset-shadow-xs">
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
            <span className="text-gray-700">{userName}</span>
            <button
              className="p-2 rounded hover:bg-gray-100"
              onClick={userLogout}
            >
              <LogOut className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="overflow-y-auto bg-gray-100">
          {!loading ? <Outlet /> : <p>Loading...</p>}
        </main>
      </div>
    </div>
  );
}
