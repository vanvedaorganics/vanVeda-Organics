// services/realtimeService.js
import { Client } from "appwrite";
import store from "../store/store";
import conf from "../conf/conf";

import {
  addProduct,
  updateProduct,
  deleteProduct,
} from "../store/productsSlice";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "../store/categoriesSlice";
import { addOrder, updateOrder } from "../store/ordersSlice";
import { addCart, updateCart, deleteCart } from "../store/cartsSlice";
import { addUser, updateUser } from "../store/usersSlice";

// Setup Appwrite Client
const client = new Client()
  .setEndpoint(conf.appwriteUrl)
  .setProject(conf.appwriteProjectId);

// Define mapping of collections → Redux handlers
const collectionHandlers = {
  [conf.appwriteProductsCollection]: {
    create: (payload) => store.dispatch(addProduct(payload)),
    update: (payload) => store.dispatch(updateProduct(payload)),
    delete: (id) => store.dispatch(deleteProduct(id)),
  },
  [conf.appwriteCategoriesCollection]: {
    create: (payload) => store.dispatch(addCategory(payload)),
    update: (payload) => store.dispatch(updateCategory(payload)),
    delete: (id) => store.dispatch(deleteCategory(id)),
  },
  [conf.appwriteOrdersCollection]: {
    create: (payload) => store.dispatch(addOrder(payload)),
    update: (payload) => store.dispatch(updateOrder(payload)),
  },
  [conf.appwriteCartsCollection]: {
    create: (payload) => store.dispatch(addCart(payload)),
    update: (payload) => store.dispatch(updateCart(payload)),
    delete: (id) => store.dispatch(deleteCart(id)),
  },
  [conf.appwriteUsersCollection]: {
    create: (payload) => store.dispatch(addUser(payload)),
    update: (payload) => store.dispatch(updateUser(payload)),
  },
};

// Initialize subscriptions
export const initRealtimeSubscriptions = () => {
  Object.keys(collectionHandlers).forEach((collectionId) => {
    client.subscribe(
      `databases.${conf.appwriteDatabaseId}.collections.${collectionId}.documents`,
      (res) => {
        console.log("[Realtime Event]", res);

        const handler = collectionHandlers[collectionId];

        if (res.events.some((e) => e.includes(".create"))) {
          console.log("[Realtime Create Payload]", res.payload);
          handler.create && handler.create(res.payload);
        }
        if (res.events.some((e) => e.includes(".update"))) {
          handler.update && handler.update(res.payload);
        }
        if (res.events.some((e) => e.includes(".delete"))) {
          handler.delete && handler.delete(res.payload.$id); 
        }
      }
    );
  });
};
