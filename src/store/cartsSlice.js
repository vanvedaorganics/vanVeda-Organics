// store/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";
import authService from "../appwrite/authService";

// Fetch cart for current user
export const fetchCart = createAsyncThunk("cart/fetch", async () => {
  const user = await authService.getUser();
  return await appwriteService.getCart(user.$id); // assumes cart exists
});

// Update cart items
export const updateUserCart = createAsyncThunk("cart/update", async (items) => {
  const user = await authService.getUser();
  const updated = await appwriteService.updateCart(user.$id, { items });
  return updated;
});

// Empty cart
export const emptyUserCart = createAsyncThunk("cart/empty", async () => {
  const user = await authService.getUser();
  const emptied = await appwriteService.emptyCart(user.$id);
  return emptied;
});

const cartSlice = createSlice({
  name: "cart",
  initialState: { cart: null, loading: false, error: null, fetched: false },
  reducers: {
    setCart: (state, action) => {
      state.cart = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchCart.fulfilled, (s, a) => {
        s.loading = false;
        s.cart = a.payload;
        s.error = null;
        s.fetched = true;
      })
      .addCase(fetchCart.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
        s.fetched = true;
      })
      .addCase(updateUserCart.fulfilled, (s, a) => {
        s.cart = a.payload;
      })
      .addCase(emptyUserCart.fulfilled, (s, a) => {
        s.cart = a.payload;
      });
  },
});

export const { setCart } = cartSlice.actions;
export default cartSlice.reducer;
