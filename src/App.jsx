import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import { Header, Footer } from "./components";
import appwriteAuthService from "./appwrite/authService";
import { login, logout } from "./store/authSlice";
import { Loader2 } from "lucide-react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    if (window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location]);

 useEffect(() => {
  appwriteAuthService
    .getUser()
    .then((userData) => {
      if (userData) {
        dispatch(login(userData));
      } else {
        dispatch(logout());
      }
    })
    .catch(() => {
      // swallow error silently so no "Uncaught (in promise)" appears
      dispatch(logout());
    })
    .finally(() => setLoading(false));
}, [dispatch]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#744531] animate-spin" />
          <p className="text-[#744531] text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
