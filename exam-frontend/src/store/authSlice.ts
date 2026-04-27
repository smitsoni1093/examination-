import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  role: string | null;
  name: string | null;
  adminId: number | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  name: localStorage.getItem('name'),
  adminId: localStorage.getItem('adminId') ? Number(localStorage.getItem('adminId')) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{token: string, role: string, name: string, adminId?: number | null}>) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.name = action.payload.name;
      state.adminId = action.payload.adminId ?? null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('role', action.payload.role);
      localStorage.setItem('name', action.payload.name);
      if (action.payload.adminId !== undefined && action.payload.adminId !== null) {
        localStorage.setItem('adminId', String(action.payload.adminId));
      } else {
        localStorage.removeItem('adminId');
      }
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.name = null;
      state.adminId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('adminId');
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
