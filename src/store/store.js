import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import productsReducer from "./productsSlice";
import categoriesReducer from "./categoriesSlice";
import usersReducer from "./usersSlice";
import ordersReducer from "./ordersSlice";
import cartsReducer from "./cartsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    users: usersReducer,
    orders: ordersReducer,
    carts: cartsReducer,
  },
});

export default store;
