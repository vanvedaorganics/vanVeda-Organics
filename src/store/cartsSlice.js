import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

export const fetchCarts = createAsyncThunk("carts/fetch", async () => {
  const res = await appwriteService.listCarts();
  return res.documents;
});

const cartsSlice = createSlice({
  name: "carts",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    addCart: (state, action) => {
      state.items.push(action.payload);
    },
    updateCart: (state, action) => {
      const idx = state.items.findIndex((c) => c.$id === action.payload.$id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteCart: (state, action) => {
      state.items = state.items.filter((c) => c.$id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarts.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchCarts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchCarts.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { addCart, updateCart, deleteCart } = cartsSlice.actions;
export default cartsSlice.reducer;
