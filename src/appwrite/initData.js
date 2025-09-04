// services/initData.js
import store from "../store/store";
import { fetchProducts } from "../store/productsSlice";
import { fetchCategories } from "../store/categoriesSlice";
import { fetchOrders } from "../store/ordersSlice";
import { fetchCarts } from "../store/cartsSlice";
import { fetchUsers } from "../store/usersSlice";
import { initRealtimeSubscriptions } from "./realtimeService.js";

export const initializeAppData = async () => {
  try {
    console.log("[Init] Fetching initial data...");

    // Dispatch initial fetches
    await Promise.all([
      store.dispatch(fetchProducts()),
      store.dispatch(fetchCategories()),
      store.dispatch(fetchOrders()),
      store.dispatch(fetchCarts()),
      store.dispatch(fetchUsers()),
    ]);

    console.log("[Init] Initial data loaded.");

    // Start realtime listeners
    initRealtimeSubscriptions();
    console.log("[Init] Realtime subscriptions started.");
  } catch (error) {
    console.error("[Init] Error initializing app data:", error);
  }
};
