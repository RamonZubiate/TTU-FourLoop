import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from "./firebaseConfig.js";
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
  accentColor: "grey",
  school: '',
  pc_index: 'quickstart',  // Add default pc_index value
  messages: [] as Message[],
  isLoading: false,
  error: null as string | null,
};


export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUID: (state, action) => {
      state.uid = action.payload;
    },
    setUserEmail: (state, action) => {
      state.email = action.payload;
    },
    setUserPassword: (state, action) => {
      state.password = action.payload;
    },
    setAccentColor: (state, action) => {
      state.accentColor = action.payload;
    },
    setUserSchool: (state, action) => {
      state.school = action.payload;
    },
    setpc_index: (state, action: PayloadAction<string>) => {  // Add this
      state.pc_index = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const currentTime = Date.now();
      state.messages = [
        ...state.messages.filter(msg => currentTime - msg.timestamp < 3600000),
        action.payload
      ];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetState: () => initialState,
  },
});


// Thunk action to handle school selection
export const selectSchool = (schoolName: string): AppThunk => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));

    const schoolsRef = collection(db, 'schools');
    const q = query(schoolsRef, where("school", "==", schoolName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const schoolData = querySnapshot.docs[0].data();
      dispatch(setUserSchool(schoolData.school));
      dispatch(setAccentColor(schoolData.accentColor));
      dispatch(setpc_index(schoolData.pc_index || 'quickstart')); // Store pc-index in Redux
    } else {
      dispatch(setError('School not found'));
    }
  } catch (error) {
    console.error('Error fetching school data:', error);
    dispatch(setError('Failed to fetch school data'));
  } finally {
    dispatch(setLoading(false));
  }
};


export const {
  setUID,
  setUserEmail,
  setUserPassword,
  setAccentColor,
  setUserSchool,
  addMessage,
  setLoading,
  setError,
  setpc_index,
  resetState,
} = userSlice.actions;

export default userSlice.reducer;