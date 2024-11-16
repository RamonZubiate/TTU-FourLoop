import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, Flag, Home, Map, MessageCircle, User } from 'react-native-feather';
import {Provider, useDispatch} from 'react-redux';
import store from './store'; // adjust the path to your store
import {PersistGate} from 'redux-persist/integration/react';
import {persistor} from './store'; // Adjust the path as necessary
import {useAppDispatch, useAppSelector} from './hooks';
// Import your pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import MapScreen from './pages/MapScreen';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import PlacesPage from './pages/PlacesPage';
import PlacesListPage from './pages/PlacesList';
// Create stack and tab navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator Component
function TabNavigator() {
  const accentColor = useAppSelector(state => state.user.accentColor);
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff' }, // Optional styling for tab bar
      })}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="MapPage"
        component={MapScreen}  // You can replace this with a User/Profile screen
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} width={22} height={22} />,
        }}
      />
      {/* Events Tab */}
      <Tab.Screen
        name="Events"
        component={EventsPage}
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} width={22} height={22} />,
          headerShown: false
        }}
      />

      {/* Chat Tab */}
      <Tab.Screen
        name="Chat"
        component={ChatPage}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} width={22} height={22} />,
        }}
      />
      {/* User/Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} width={22} height={22} />,
        }}
      />

    </Tab.Navigator>
  );
}

// Stack Navigator that wraps the Tab Navigator
export default function App() {
  return (
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }} // Hides the header for tab screens
        />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="EventsPage" component={EventsPage} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="ChatPage" component={ChatPage} />
        <Stack.Screen name="ProfilePage" component={ProfilePage} />
        <Stack.Screen name="Places" component={PlacesPage} />
        <Stack.Screen name="PlacesList" component={PlacesListPage} options={{headerShown:false}}/>
      </Stack.Navigator>
    </NavigationContainer>
    </PersistGate>
    </Provider>
  );
}
