import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

// Async thunk - initial load
export const fetchProducts = createAsyncThunk("products/fetch", async () => {
  const res = await appwriteService.listProducts();
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
  // Delegate core field normalization (packaging_size, batch) to the service
  let normalized = appwriteService.normalizeProductDoc(incoming);

  // Preserve existing fields if they were missing or null in incoming (Appwrite sometimes returns partial docs)

  


  // Preserve expanded category object if incoming only has id string
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
  initialState: { items: [], loading: false, error: null, fetched: false },
  reducers: {
    addProduct: (state, action) => {
      const normalized = normalizeProductDoc(action.payload);
      const exists = state.items.some((p) => p.$id === normalized.$id);
      if (!exists) {
        state.items.push(normalized);
      } else {
        // If already exists (e.g., from realtime), merge with normalization
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
        // If not found, add it (edge case)
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
        s.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload; // Already normalized in appwriteConfigService
        s.fetched = true;
      })
      .addCase(fetchProducts.rejected, (s, a) => {
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

// ✅ Memoized selector for discountable products
export const selectAllProducts = (state) => state.products.items;

export const selectDiscountableProducts = createSelector(
  [selectAllProducts],
  (items) => items.filter((p) => Number(p.discount) === 0)
);

export const { addProduct, updateProduct, deleteProduct } =
  productsSlice.actions;
export default productsSlice.reducer;
