import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService"

// Async thunk - initial load
export const fetchProducts = createAsyncThunk("products/fetch", async () => {
  const res = await appwriteService.listProducts();
  return res.documents;
});

const productsSlice = createSlice({
  name: "products",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    addProduct: (state, action) => {
      state.items.push(action.payload);
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
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { addProduct, updateProduct, deleteProduct } =
  productsSlice.actions;
export default productsSlice.reducer;
