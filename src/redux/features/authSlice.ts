import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../../lib/axios';
import { isPrivilegedRole } from '../../lib/roles';

interface UserCredentials {
  email: string;
  password: string;
}

interface forgetCredentials {
  email: string;
}

interface validateOtpCredentials {
  email: string;
  otp: string;
}

interface ChangePasswordCredentials {
  userId: string;
  token: string;
  password: string;
}

interface ChangePasswordResponse {
  message?: string;
}

interface GoogleUserCredentials {
  googleUid: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
}

interface AuthState {
  user: any | null;
  token: any | null;
  loading: boolean;
  error: any | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null
};

interface RegisterCredentials {
  email: string;
  password: string;
  role: string; // You can adjust the type as needed
  name: string;
}

// Define the response type for registration
interface RegisterResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UserResponse {
  success: boolean;
  message?: string;
  data?: object;
}

interface ForgetResponse {
  message?: string;
}

interface ValidateOtpResponse {
  success: boolean;
  message?: string;
  data?: object;
}

export const registerUser = createAsyncThunk<
  RegisterResponse,
  RegisterCredentials
>('auth/register', async (userCredentials) => {
  const request = await axiosInstance.post(`/auth/signup`, userCredentials);
  const response = await request.data;
  return response;
});

// Async thunk for logging in a user
export const loginUser = createAsyncThunk<UserResponse, UserCredentials>(
  'auth/login',
  async (userCredentials) => {
    const request = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      userCredentials,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' //this line solved cors
        }
      }
    );

    const response = await request.data;

    localStorage.setItem('uniaid', JSON.stringify(response.data.accessToken));
    return response;
  }
);

export const authWithFbORGoogle = createAsyncThunk<
  UserResponse,
  GoogleUserCredentials
>('auth/google', async (googleUserCredentials) => {
  const request = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/google`,
    googleUserCredentials,
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json' //this line solved cors
      }
    }
  );
  const response = await request.data;
  localStorage.setItem('uniaid', JSON.stringify(response.data.accessToken));
  return response;
});
// forgot password

// The password reset pages show the API's own message when a step fails
const apiErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  // "Validation Error" is only a label, the reason is in errorSources
  if (data?.message === 'Validation Error') {
    return (
      data.errorSources?.[0]?.message ||
      'Please check the details you entered and try again.'
    );
  }
  return data?.message || 'Server not reachable, please try again';
};

export const requestOtp = createAsyncThunk<
  ForgetResponse,
  forgetCredentials,
  { rejectValue: string }
>('auth/forget', async (userCredentials, { rejectWithValue }) => {
  try {
    const request = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/forget`,
      userCredentials,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' //this line solved cors
        }
      }
    );
    return request.data;
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

// validate request OTP
export const validateRequestOtp = createAsyncThunk<
  ValidateOtpResponse,
  validateOtpCredentials,
  { rejectValue: string }
>('auth/validate', async (userCredentials, { rejectWithValue }) => {
  try {
    const request = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/validate`,
      userCredentials,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' //this line solved cors
        }
      }
    );
    return request.data;
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

// patch new password
export const changePassword = createAsyncThunk<
  ChangePasswordResponse,
  ChangePasswordCredentials,
  { rejectValue: string }
>('users/:id', async (userCredentials, { rejectWithValue }) => {
  try {
    const request = await axios.patch(
      `${import.meta.env.VITE_API_URL}/users/${userCredentials.userId}`,
      { password: userCredentials.password },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json', //this line solved cors
          Authorization: `Bearer ${userCredentials.token}`
        }
      }
    );
    return request.data;
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const logout = createAsyncThunk<void>('user/logout', async () => {
  localStorage.removeItem('uniaid');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null; // Reset the error state
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.user = null;
        state.error = null;
        state.token = null;
      })
      .addCase(loginUser.fulfilled, (state, action: any) => {
        state.loading = false;
        state.token = action.payload.data.accessToken;
        const decodedUser = jwtDecode(action.payload.data.accessToken);

        // Create a mutable copy of the decoded user
        const userWithPrivileges = { ...decodedUser };

        // Assign privileges if they exist in the response (staff and teachers)
        if (
          isPrivilegedRole(userWithPrivileges.role) &&
          action.payload.data.privileges
        ) {
          userWithPrivileges.privileges = action.payload.data.privileges;
        }

        state.user = userWithPrivileges;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = 'Please Check Your Login Credentials';
        state.token = null;
      })
      .addCase(authWithFbORGoogle.pending, (state) => {
        state.loading = true;
        state.user = null;
        state.error = null;
        state.token = null;
      })
      .addCase(authWithFbORGoogle.fulfilled, (state, action: any) => {
        state.loading = false;
        state.token = action.payload.data.accessToken;
        const decodedUser = jwtDecode(action.payload.data.accessToken);

        // Create a mutable copy of the decoded user
        const userWithPrivileges = { ...decodedUser };

        // Assign privileges if they exist in the response (staff and teachers)
        if (
          isPrivilegedRole(userWithPrivileges.role) &&
          action.payload.data.privileges
        ) {
          userWithPrivileges.privileges = action.payload.data.privileges;
        }

        state.user = userWithPrivileges;
        state.error = null;
      })
      .addCase(authWithFbORGoogle.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = 'Please Check Your Login Credentials';
        state.token = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null; // Clear user state on logout
        state.error = null;
        state.token = null;
      });
  }
});

export const { resetError } = authSlice.actions;
export default authSlice.reducer;
