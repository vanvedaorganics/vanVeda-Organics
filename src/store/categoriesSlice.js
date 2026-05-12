import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

// Helper to get cached data
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 1 hour
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

export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async () => {
    const cached = getCachedData('categories_cache');
    if (cached) {
      console.log("[Categories] Using cached data to save bandwidth");
      return cached;
    }

    const res = await appwriteService.listCategories();
    setCachedData('categories_cache', res.documents);
    return res.documents;
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: { 
    items: getCachedData('categories_cache') || [], 
    loading: false, 
    error: null 
  },
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
        console.log("[Categories] Fetch pending...");
        if (s.items.length === 0) s.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (s, a) => {
        console.log("[Categories] Fetch fulfilled, count:", a.payload?.length);
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchCategories.rejected, (s, a) => {
        console.error("[Categories] Fetch rejected:", a.error.message);
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { addCategory, updateCategory, deleteCategory } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
