import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import { AppThunk } from './store';
interface Message {
  text: string;
  isBot: boolean;
  timestamp: number;
}


const initialState = {
  uid: null,
  email: '',
  password: '',
  accentColor: "#CC0000",
  messages: [] as Message[],
  isLoading: false
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

      addMessage: (state, action: PayloadAction<Message>) => {
        const currentTime = Date.now();
        // Keep messages newer than 1 hour
        state.messages = [
          ...state.messages.filter(msg => currentTime - msg.timestamp < 3600000),
          action.payload
        ];
      },
      setLoading: (state, action: PayloadAction<boolean>) => {
        state.isLoading = action.payload;
      },
    resetState: () => initialState,
  },
});

export const {
  setUID,
  setUserEmail,
  setUserPassword,
  setAccentColor,
  addMessage,
  setLoading,
  resetState
} = userSlice.actions;



export default userSlice.reducer;
