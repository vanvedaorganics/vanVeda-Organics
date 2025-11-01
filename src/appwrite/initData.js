// services/initData.js
import store from "../store/store";
import { fetchProducts } from "../store/productsSlice";
import { fetchCategories } from "../store/categoriesSlice";
import { fetchOrders } from "../store/ordersSlice";
import { fetchCart } from "../store/cartsSlice";
import { fetchUsers } from "../store/usersSlice";
import { initRealtimeSubscriptions } from "./realtimeService.js";

export const initializeAppData = async () => {
  try {
    // Dispatch initial fetches
    await Promise.all([
      store.dispatch(fetchProducts()),
      store.dispatch(fetchCategories()),
      store.dispatch(fetchOrders()),
      store.dispatch(fetchCart()),
      store.dispatch(fetchUsers()),
    ]);

    // Start realtime listeners
    initRealtimeSubscriptions();
  } catch (error) {
    console.error("[Init] Error initializing app data:", error);
  }
};
