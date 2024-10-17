import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { AppThunk } from './store';


const initialState = {
  uid: null,
  email: '',
  password: '',
  accentColor: "#CC0000"
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUID: (state, action) => {
      state.uid = action.payload;
    },
    setUserEmail: (state, action) => {
      // Add setEmail and setPassword reducers
      state.email = action.payload;
    },
    setUserPassword: (state, action) => {
      state.password = action.payload;
    },
    setAccentColor: (state, action) => {
        state.password = action.payload;
      },


    resetState: () => initialState,
  },
});

export const {
  setUID,
  setUserEmail,
  setUserPassword,
  setAccentColor
} = userSlice.actions;



export default userSlice.reducer;
