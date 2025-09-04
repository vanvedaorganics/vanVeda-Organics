import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";

export const fetchUsers = createAsyncThunk("users/fetch", async () => {
  const res = await appwriteService.listUserProfiles();
  return res.documents;
});

const usersSlice = createSlice({
  name: "users",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    addUser: (state, action) => {
      state.items.push(action.payload);
    },
    updateUser: (state, action) => {
      const idx = state.items.findIndex((u) => u.$id === action.payload.$id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchUsers.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export const { addUser, updateUser } = usersSlice.actions;
export default usersSlice.reducer;
