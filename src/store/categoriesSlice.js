import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async () => {
    const res = await appwriteService.listCategories();
    return res.documents;
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    addCategory: (state, action) => {
      state.items.push(action.payload);
    },
    updateCategory: (state, action) => {
      const idx = state.items.findIndex((c) => c.$id === action.payload.$id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteCategory: (state, action) => {
      state.items = state.items.filter((c) => c.$id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchCategories.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { addCategory, updateCategory, deleteCategory } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
