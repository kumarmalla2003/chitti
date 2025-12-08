import { createSlice } from "@reduxjs/toolkit";
import { logout as logoutService, getCurrentUser } from "./authService";

const initialState = {
  user: null,
  isLoggedIn: false,
  loading: true, // Add loading state for session check
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isLoggedIn = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setLoading } = authSlice.actions;

// Thunk for logout to handle side effect
export const performLogout = () => async (dispatch) => {
  try {
    await logoutService();
  } catch (error) {
    console.error("Logout failed", error);
  } finally {
    dispatch(logout());
  }
};

// Thunk to check session and fetch user
export const checkSession = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const user = await getCurrentUser();
    // Assuming backend returns user object.
    // We might need to map it if structure differs from expected frontend user state.
    // For now assuming it returns { phone_number: ... } or similar.
    // Ideally loginSuccess expects { user: ... }.
    dispatch(loginSuccess({ user }));
  } catch (error) {
    // If 401, just ensure logged out state
    dispatch(logout());
  } finally {
    dispatch(setLoading(false));
  }
};

export default authSlice.reducer;
