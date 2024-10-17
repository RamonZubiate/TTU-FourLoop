import React from 'react';
import { View, Text, Image, Button, StyleSheet } from 'react-native';

const ProfilePage: React.FC = () => {
  // Sample user data, can be fetched from a real API
  const user = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
  };

  // Handle logout functionality (to be replaced with actual functionality)
  const handleLogout = () => {
    console.log('User logged out');
  };

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <Image source={{ uri: user.profileImage }} style={styles.profileImage} />

      {/* User Information */}
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* Logout Button */}
      <Button title="Logout" onPress={handleLogout} color="#CC0000" />
    </View>
  );
};

// Styling for the profile page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});

export default ProfilePage;
