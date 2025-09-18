// store/cartsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appwriteService from "../appwrite/appwriteConfigService";
import authService from "../appwrite/authService"; 

/* ---------- Helpers ---------- */

function normalizeItems(items) {
  if (!items) return {};
  if (typeof items === "object" && !Array.isArray(items)) {
    const keys = Object.keys(items);
    const allNumericKeys =
      keys.length > 0 && keys.every((k) => /^\d+$/.test(k));
    const allSingleCharValues =
      keys.length > 0 &&
      keys.every((k) => typeof items[k] === "string" && items[k].length === 1);

    if (allNumericKeys && allSingleCharValues) {
      // rebuild string and parse
      const ordered = keys
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => items[k])
        .join("");
      try {
        return JSON.parse(ordered);
      } catch (e) {
        return {};
      }
    }

    // Already a slug->qty object
    return items;
  }

  if (typeof items === "string") {
    try {
      return JSON.parse(items);
    } catch (err) {
      try {
        const stripped = items.trim();
        return JSON.parse(stripped);
      } catch (e2) {
        return {};
      }
    }
  }

  return {};
}

/* ---------- Async thunks ---------- */

export const fetchCart = createAsyncThunk("cart/fetch", async () => {
  const user = await authService.getUser();
  const doc = await appwriteService.getCart(user.$id);
  return { ...doc, items: normalizeItems(doc?.items) };
});

export const updateUserCart = createAsyncThunk(
  "cart/update",
  async (items, { rejectWithValue }) => {
    try {
      const user = await authService.getUser();
      const itemsObj = normalizeItems(items);
      const updated = await appwriteService.updateCart(user.$id, {
        items: itemsObj,
      });
      return { ...updated, items: normalizeItems(updated?.items ?? itemsObj) };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to sync cart");
    }
  }
);

export const emptyUserCart = createAsyncThunk("cart/empty", async () => {
  const user = await authService.getUser();
  const emptied = await appwriteService.emptyCart(user.$id);
  return { ...emptied, items: normalizeItems(emptied?.items) };
});

/* ---------- Debounce scheduler ---------- */
let syncTimer = null;
const DEBOUNCE_MS = 800;

function scheduleSync(dispatch, getState, prevCartSnapshot) {
  if (syncTimer) clearTimeout(syncTimer);

  const itemsAtSchedule = () => {
    const state = getState();
    const raw = state.carts.cart?.items ?? {};
    return normalizeItems(raw);
  };

  syncTimer = setTimeout(async () => {
    syncTimer = null;
    const items = itemsAtSchedule();

    try {
      const resultAction = await dispatch(updateUserCart(items));
      if (updateUserCart.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || resultAction.error.message);
      }
      // success — extraReducer will update state
    } catch (err) {
      if (prevCartSnapshot) {
        dispatch(setCart(prevCartSnapshot));
      }
      dispatch(setError(err?.message || "Failed to sync cart"));
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }
    }
  }, DEBOUNCE_MS);
}

/* ---------- Slice ---------- */

const cartsSlice = createSlice({
  name: "cart",
  initialState: {
    cart: null,
    loading: false,
    error: null,
    fetched: false,
  },
  reducers: {
    setCart: (state, action) => {
      state.cart = {
        ...action.payload,
        items: normalizeItems(action.payload?.items),
      };
      state.error = null;
    },
    setItems: (state, action) => {
      if (!state.cart) state.cart = { items: {} };
      state.cart.items = normalizeItems(action.payload);
    },
    setItemQuantityLocal: (state, action) => {
      const { slug, qty } = action.payload;
      if (!state.cart) state.cart = { items: {} };
      const items = { ...(state.cart.items || {}) };
      if (qty <= 0) {
        delete items[slug];
      } else {
        items[slug] = Number(qty);
      }
      state.cart.items = items;
      state.error = null;
    },
    removeItemLocal: (state, action) => {
      const slug = action.payload;
      if (!state.cart) return;
      const items = { ...(state.cart.items || {}) };
      delete items[slug];
      state.cart.items = items;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setEmptyCart: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
      state.fetched = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchCart.fulfilled, (s, a) => {
        s.loading = false;
        s.cart = { ...a.payload, items: normalizeItems(a.payload?.items) };
        s.error = null;
        s.fetched = true;
      })
      .addCase(fetchCart.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
        s.fetched = true;
      })
      .addCase(updateUserCart.fulfilled, (s, a) => {
        s.cart = { ...a.payload, items: normalizeItems(a.payload?.items) };
        s.error = null;
      })
      .addCase(updateUserCart.rejected, (s, a) => {
        s.error = a.payload || a.error.message;
      })
      .addCase(emptyUserCart.fulfilled, (s, a) => {
        s.cart = { ...a.payload, items: normalizeItems(a.payload?.items) };
      });
  },
});

export const {
  setCart,
  setItems,
  setItemQuantityLocal,
  removeItemLocal,
  setError,
  setEmptyCart,
} = cartsSlice.actions;

/* ---------- Thunk action creators for optimistic updates + scheduled sync ---------- */

export const changeItemQuantity =
  ({ slug, qty }) =>
  (dispatch, getState) => {
    const state = getState();
    const prevCartSnapshot = state.carts.cart
      ? { ...state.carts.cart, items: { ...(state.carts.cart.items ?? {}) } }
      : null;

    dispatch(setItemQuantityLocal({ slug, qty }));
    scheduleSync(dispatch, getState, prevCartSnapshot);
  };

export const addItemOne = (slug) => (dispatch, getState) => {
  const state = getState();
  const currentQty = state.carts.cart?.items?.[slug] ?? 0;
  return dispatch(changeItemQuantity({ slug, qty: currentQty + 1 }));
};

export const removeItemCompletely = (slug) => (dispatch) => {
  return dispatch(changeItemQuantity({ slug, qty: 0 }));
};

/* ---------- Selectors ---------- */

export const selectCartItems = (state) =>
  normalizeItems(state.carts.cart?.items ?? {});
export const selectCartTotalCount = (state) => {
  const items = selectCartItems(state);
  return Object.values(items).reduce((acc, v) => acc + Number(v || 0), 0);
};

export default cartsSlice.reducer;
