import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';

const categories = [
  { id: '1', title: 'Food', image: 'https://example.com/food.jpg' },
  { id: '2', title: 'Recreational', image: 'https://example.com/recreational.jpg' },
  { id: '3', title: 'Student', image: 'https://example.com/student.jpg' },
  // Add more categories as needed
];

const places = [
  { id: '1', title: 'Cafeteria', image: 'https://example.com/cafeteria.jpg' },
  { id: '2', title: 'Library', image: 'https://example.com/library.jpg' },
  { id: '3', title: 'Gym', image: 'https://example.com/gym.jpg' },
  // Add more places as needed
];

const PlacesPage = () => {
  return (
    <View style={styles.container}>

      {/* Horizontal FlatList for Categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.largeCard}>
            <Image source={{ uri: item.image }} style={styles.largeCardImage} />
            <Text style={styles.largeCardText}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.subHeader}>Nearby</Text>

      {/* Horizontal FlatList for Places */}
      <FlatList
        data={places}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.smallCard}>
            <Image source={{ uri: item.image }} style={styles.smallCardImage} />
            <Text style={styles.smallCardText}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  largeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 250,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  largeCardImage: {
    width: '100%',
    height: 150,
  },
  largeCardText: {
    padding: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  smallCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 120,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  smallCardImage: {
    width: '100%',
    height: 80,
  },
  smallCardText: {
    padding: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default PlacesPage;
