import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from '@/utils/axios'

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/signup', userData)
      const { token, refreshToken, user } = response.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      return { token, refreshToken, user }
    } catch (error) {
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        const message = error.response?.data?.message || 
          'Too many signup attempts. Please wait 15 minutes before trying again.'
        return rejectWithValue(message)
      }
      return rejectWithValue(
        error.response?.data?.message || 'Signup failed'
      )
    }
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', userData)
      const { token, refreshToken, user } = response.data.data
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      return { token, refreshToken, user }
    } catch (error) {
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        const message = error.response?.data?.message || 
          'Too many login attempts. Please wait 15 minutes before trying again.'
        return rejectWithValue(message)
      }
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      )
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/api/auth/logout')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return null
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return rejectWithValue(
        error.response?.data?.message || 'Logout failed'
      )
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/auth/me')
      return response.data.data.user
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get user'
      )
    }
  }
)

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = getState().auth.refreshToken || localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      // Use axios instance which has correct baseURL from config
      const response = await axios.post('/api/auth/refresh', { refreshToken })
      const { token } = response.data.data
      localStorage.setItem('token', token)
      return token
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return rejectWithValue(
        error.response?.data?.message || 'Token refresh failed'
      )
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch, getState, rejectWithValue }) => {
    const token = getState().auth.token || localStorage.getItem('token')
    if (!token) {
      return rejectWithValue('No token found')
    }
    try {
      const user = await dispatch(getCurrentUser()).unwrap()
      return { user, isAuthenticated: true }
    } catch (error) {
      // Try to refresh token
      try {
        await dispatch(refreshAccessToken()).unwrap()
        const user = await dispatch(getCurrentUser()).unwrap()
        return { user, isAuthenticated: true }
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        return rejectWithValue('Authentication failed')
      }
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/protected/user/profile', profileData)
      return response.data.data.user
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      )
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await axios.patch('/api/protected/user/password', passwordData)
      return true
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to change password'
      )
    }
  }
)

export const updateCurrency = createAsyncThunk(
  'auth/updateCurrency',
  async (currency, { rejectWithValue, dispatch }) => {
    try {
      await axios.patch('/api/protected/user/currency', { currency })
      // Refresh user data to get updated currency
      await dispatch(getCurrentUser())
      return currency
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update currency'
      )
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setToken: (state, action) => {
      state.token = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.error = action.payload
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.error = action.payload
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
      // Refresh Token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.user = null
      })
      // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAuthenticated = action.payload.isAuthenticated
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Currency
      .addCase(updateCurrency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        state.loading = false
        if (state.user) {
          state.user.currency = action.payload
        }
        state.error = null
      })
      .addCase(updateCurrency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setToken, logout: logoutAction } = authSlice.actions
export default authSlice.reducer

