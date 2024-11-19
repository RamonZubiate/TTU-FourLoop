import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Bell, Map, MessageCircle, User } from 'react-native-feather';
import { Provider } from 'react-redux';
import store from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';
import { useAppSelector } from './hooks';

// Import your pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import MapScreen from './pages/MapScreen';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SchoolSelectPage from './pages/SchoolSelectPage.jsx';
import PlacesListPage from './pages/PlacesList';

// Create stack and tab navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const accentColor = useAppSelector(state => state.user.accentColor);
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff' },
      })}
    >
      <Tab.Screen
        name="MapPage"
        component={MapScreen}
        options={{
         tabBarIcon: ({ color, size }) => <Map color={color} width={22} height={22} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsPage}
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} width={22} height={22} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatPage}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} width={22} height={22} />,
        }}
      />
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

const NavigationWrapper = () => {
  const school = useAppSelector(state => state.user.school);

  return (
    <Stack.Navigator>
      {school === '' ? (
        <Stack.Screen
          name="SchoolSelect"
          component={SchoolSelectPage}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="HomePage" component={HomePage} />
          <Stack.Screen name="EventsPage" component={EventsPage} />
          <Stack.Screen name="MapScreen" component={MapScreen} />
          <Stack.Screen name="ChatPage" component={ChatPage} />
          <Stack.Screen name="ProfilePage" component={ProfilePage} />
          <Stack.Screen name="PlacesList" component={PlacesListPage} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <NavigationWrapper />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
