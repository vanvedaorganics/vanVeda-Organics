import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

// Helper to get cached data
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 1 hour to prevent excessive API calls
    if (Date.now() - timestamp > 3600000) return null;
    return data;
  } catch (e) {
    return null;
  }
};

// Helper to set cached data
const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
};

// Async thunk - initial load
export const fetchProducts = createAsyncThunk("products/fetch", async (_, { getState }) => {
  // Check if we already have valid cache to avoid unnecessary bandwidth usage
  const cached = getCachedData('products_cache');
  if (cached) {
    console.log("[Products] Using cached data to save bandwidth");
    return cached;
  }

  const res = await appwriteService.listProducts();
  setCachedData('products_cache', res.documents);
  return res.documents;
});

export const updateProductDiscount = createAsyncThunk(
  "products/updateDiscount",
  async ({ productId, discount }) => {
    const updated = await appwriteService.updateProductDiscount(
      productId,
      discount
    );
    return updated;
  }
);

// Helper: normalize product document to prevent field degradation
const normalizeProductDoc = (incoming, existingItem = {}) => {
  let normalized = appwriteService.normalizeProductDoc(incoming);
  if (
    typeof normalized.categories === "string" &&
    existingItem &&
    typeof existingItem.categories === "object" &&
    existingItem.categories !== null
  ) {
    normalized.categories = existingItem.categories;
  }
  return normalized;
};

const productsSlice = createSlice({
  name: "products",
  initialState: { 
    items: getCachedData('products_cache') || [], 
    loading: false, 
    error: null, 
    fetched: !!getCachedData('products_cache') 
  },
  reducers: {
    addProduct: (state, action) => {
      const normalized = normalizeProductDoc(action.payload);
      const exists = state.items.some((p) => p.$id === normalized.$id);
      if (!exists) {
        state.items.push(normalized);
      } else {
        const idx = state.items.findIndex((p) => p.$id === normalized.$id);
        if (idx !== -1) {
          state.items[idx] = normalizeProductDoc(normalized, state.items[idx]);
        }
      }
    },
    updateProduct: (state, action) => {
      const idx = state.items.findIndex((p) => p.$id === action.payload.$id);
      if (idx !== -1) {
        state.items[idx] = normalizeProductDoc(
          action.payload,
          state.items[idx]
        );
      } else {
        state.items.push(normalizeProductDoc(action.payload));
      }
    },
    deleteProduct: (state, action) => {
      state.items = state.items.filter((p) => p.$id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => {
        console.log("[Products] Fetch pending...");
        if (s.items.length === 0) s.loading = true; // Only show loading if no cache
      })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        console.log("[Products] Fetch fulfilled, count:", a.payload?.length);
        s.loading = false;
        s.items = a.payload;
        s.fetched = true;
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        console.error("[Products] Fetch rejected:", a.error.message);
        s.loading = false;
        s.error = a.error.message;
        s.fetched = true;
      })
      .addCase(updateProductDiscount.fulfilled, (s, a) => {
        const idx = s.items.findIndex((p) => p.$id === a.payload.$id);
        if (idx !== -1) {
          s.items[idx] = normalizeProductDoc(a.payload, s.items[idx]);
        }
      });
  },
});

export const selectAllProducts = (state) => state.products.items;

export const selectDiscountableProducts = createSelector(
  [selectAllProducts],
  (items) => items.filter((p) => Number(p.discount) === 0)
);

export const { addProduct, updateProduct, deleteProduct } =
  productsSlice.actions;
export default productsSlice.reducer;
