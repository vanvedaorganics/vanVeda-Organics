import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import "./index.css";
import App from "./App.jsx";
import AdminLayout from "../admin/pages/AdminLayout.jsx";
import Products from "../admin/pages/Products.jsx";
import AuthLayout from "../admin/components/AuthLayout.jsx";
import Login from "../admin/pages/Login.jsx";
import User from "../admin/pages/User.jsx";
import Orders from "../admin/pages/Orders.jsx";
import store from "./store/store.js";
import { initializeAppData } from "./appwrite/initData.js";
import Advertisement from "../admin/pages/Advertisement.jsx";
import Offers from "../admin/pages/Offers.jsx";

// Client pages
import Home from "./pages/Home.jsx";
import ClientProducts from "./pages/ClientProducts.jsx";
import Certificates from "./pages/Certificates.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ClientLogin from "./pages/ClientLogin.jsx";
import ClientAuthLayout from "./components/ClientAuthLayout.jsx";
import ClientSignup from "./pages/ClientSignup.jsx";

initializeAppData();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "login",
        element: (
          <ClientAuthLayout authentication={false}>
            <ClientLogin />
          </ClientAuthLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <ClientAuthLayout authentication={false}>
            <ClientSignup />
          </ClientAuthLayout>
        ),
      },
      {
        path: "products",
        element: <ClientProducts />,
      },
      {
        path: "products/:slug", // ✅ Dynamic route for product details
        element: <ProductDetails />,
      },
      {
        path: "certificates",
        element: <Certificates />,
      },
    ],
  },
  {
    path: "/admin/",
    element: <AdminLayout />,
    children: [
      {
        path: "login",
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        ),
      },
      {
        path: "products",
        element: (
          <AuthLayout authentication>
            <Products />
          </AuthLayout>
        ),
      },
      {
        path: "users",
        element: (
          <AuthLayout authentication>
            <User />
          </AuthLayout>
        ),
      },
      {
        path: "orders",
        element: (
          <AuthLayout>
            <Orders />
          </AuthLayout>
        ),
      },
      {
        path: "ads",
        element: (
          <AuthLayout>
            <Advertisement />
          </AuthLayout>
        ),
      },
      {
        path: "offers",
        element: (
          <AuthLayout>
            <Offers />
          </AuthLayout>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
