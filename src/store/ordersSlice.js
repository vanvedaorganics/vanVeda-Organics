import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

export const fetchOrders = createAsyncThunk("orders/fetch", async () => {
  const res = await appwriteService.listOrders();
  return res.documents;
});

const ordersSlice = createSlice({
  name: "orders",
  initialState: { items: [], loading: false, error: null, fetched: false },
  reducers: {
    addOrder: (state, action) => {
      state.items.push(action.payload);
    },
    updateOrder: (state, action) => {
      const idx = state.items.findIndex((o) => o.$id === action.payload.$id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
        s.fetched = true;
      })
      .addCase(fetchOrders.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
        s.fetched = true;
      });
  },
});

export const { addOrder, updateOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
