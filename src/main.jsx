import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import './index.css'
import App from './App.jsx'
import AdminLayout from '../admin/pages/AdminLayout.jsx'
import Products from '../admin/pages/Products.jsx'
import AuthLayout from '../admin/components/AuthLayout.jsx'
import Login from '../admin/pages/Login.jsx'
import User from '../admin/pages/UserLists.jsx'
import store from './store/store.js'
import { initializeAppData } from './appwrite/initData.js'

initializeAppData();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
            {" "}
            <Products />
          </AuthLayout>
        ),
      },
      {
        path: "users",
        element: (
          <AuthLayout authentication>
            {" "}
            <User />
          </AuthLayout>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}/>
    </Provider>
  </StrictMode>,
)
