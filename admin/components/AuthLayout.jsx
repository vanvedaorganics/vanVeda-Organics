import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import authService from "../../src/appwrite/authService";

export default function Protected({ children, authentication = true }) {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const authStaus = useSelector((state) => state.auth.status);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      if (authentication) {
        if (!authStaus) {
          navigate("/admin/login");
        } else {
          try {
            const isAdmin = await authService.isAdmin();
            if (active && !isAdmin) {
              navigate("/"); // Non-admins go back to home
            }
          } catch (err) {
            if (active) navigate("/admin/login");
          }
        }
      } else if (!authentication && authStaus) {
        // Already logged in, check if admin
        try {
          const isAdmin = await authService.isAdmin();
          if (active && isAdmin) navigate("/admin/products");
        } catch {
          // Ignore
        }
      }
      if (active) setLoader(false);
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, [authStaus, navigate, authentication]);

  return loader ? (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#084629] border-t-transparent"></div>
    </div>
  ) : (
    <>{children}</>
  );
}

