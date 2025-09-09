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

const productsSlice = createSlice({
  name: "products",
  initialState: { items: [], loading: false, error: null, fetched: false },
  reducers: {
    addProduct: (state, action) => {
      const exists = state.items.some((p) => p.$id === action.payload.$id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    updateProduct: (state, action) => {
      const idx = state.items.findIndex((p) => p.$id === action.payload.$id);
      if (idx !== -1) state.items[idx] = action.payload;
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
        s.items = a.payload;
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
          s.items[idx] = a.payload;
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
