import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isCartOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCartOpen: (state, action) => {
      state.isCartOpen = action.payload;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
  },
});

export const { setCartOpen, toggleCart } = uiSlice.actions;

export const selectIsCartOpen = (state) => state.ui.isCartOpen;

export default uiSlice.reducer;
