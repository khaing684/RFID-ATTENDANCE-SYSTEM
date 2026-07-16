import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../config/api';


// ===== Login Thunk =====
export const loginUser = createAsyncThunk(
    'auth/login',
    async (data , { rejectWithValue }) =>{
        try{
            const res  = await api.post ('auth/login', data );
            localStorage.setItem('token', res.data.token);
            return res.data;

        } catch (err){
            return rejectWithValue (
                err.response?.data?.message || 'Login failed'
            );
        }
    }
);

// ===== Register Thunk =====

export const registerUser = createAsyncThunk (
    'auth/register',
    async( data, { rejectWithValue }) => {
        try{
            const res = await api.post('auth/register', data);
            localStorage.setItem('token', res.data.token);
            return res.data;
        } catch(err) {
            return rejectWithValue(
                err.response?.data?.message || 'Registration failed'
            );
        }
    }
);

// ===== GetMe Thunk =====
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to get user'
      );
    }
  }
);

// ===== Auth Slice =====
 const authSlice = createSlice ({
    name:'auth',
    initialState :{
        user: null,
        token: localStorage.getItem('token'),
        loading: false,
        error: null,

    },
    reducers: {
        // Logout - state တွေအကုန်ရှင်း
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('token');
        },
         // Error message ရှင်းဖို့ (page ပြောင်းရင် error ပျောက်အောင်)
        clearError: (state) => {
             state.error = null;
        },
    },

     extraReducers: (builder) => {
    // ===== Login Cases =====
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;   // API စခေါ်ပြီ → spinner ပြ
      state.error = null;     // error အဟောင်းဖျက်
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;           // API ပြီးပြီ
      state.user = action.payload.user;  // user data သိမ်း
      state.token = action.payload.token; // token သိမ်း
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;       // API ပြီးပြီ (ဒါပေမယ့် error)
      state.error = action.payload;  // error message သိမ်း
    });

    // ===== Register Cases =====
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

     // ===== GetMe Cases =====
    builder.addCase(getMe.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
    });
    builder.addCase(getMe.rejected, (state) => {
      // token မမှန်ရင် အကုန်ရှင်းပြီး login ပြန်သွားမယ်
      state.loading = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    });
  },
 });

 export const { logout, clearError } = authSlice.actions;
 export default authSlice.reducer;