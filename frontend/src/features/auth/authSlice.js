import { createSlice } from "@reduxjs/toolkit";

// ⚠️ DEVELOPMENT ONLY: Set to true to bypass authentication UI
// Remember to set this back to false before deploying to production!
const DEV_BYPASS_AUTH = true;

const initialState = {
  user: DEV_BYPASS_AUTH ? { phone_number: "dev_user" } : null,
  isLoggedIn: DEV_BYPASS_AUTH,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
