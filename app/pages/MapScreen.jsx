import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar, Animated, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import Geolocation from 'react-native-geolocation-service';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_KEY = "AIzaSyDM0gtefOoLDFqaXmflGiKJPlRu2CTymhM";

export default function MapScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [originPredictions, setOriginPredictions] = useState([]);
  const [destinationPredictions, setDestinationPredictions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const mapRef = useRef(null);
  const inputContainerHeight = useRef(new Animated.Value(250)).current;

  // Request user location permissions and get their current position
  useEffect(() => {
    (async () => {
      Geolocation.requestAuthorization("whenInUse").then(() => {
        Geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          },
          (error) => {
            console.error('Error fetching location:', error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    })();
  }, []);

  const getAutocomplete = async (input, setPredictions) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${API_KEY}`
      );
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Error fetching autocomplete:', error);
    }
  };

  useEffect(() => {
    if (origin.length > 2) {
      getAutocomplete(origin, setOriginPredictions);
    } else {
      setOriginPredictions([]);
    }
  }, [origin]);

  useEffect(() => {
    if (destination.length > 2) {
      getAutocomplete(destination, setDestinationPredictions);
    } else {
      setDestinationPredictions([]);
    }
  }, [destination]);

  const getDirections = async () => {
    if (!destination) {
      Alert.alert("Error", "Please enter a destination.");
      return;
    }

    try {
      const startPoint = origin || `${userLocation.latitude},${userLocation.longitude}`;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint}&destination=${destination}&key=${API_KEY}`
      );

      if (response.data.status !== "OK") {
        throw new Error(response.data.status);
      }

      const route = response.data.routes[0];
      const points = route.overview_polyline.points;
      const decodedPoints = decodePolyline(points);

      setRouteCoordinates(decodedPoints);
      setDistance(route.legs[0].distance.text);
      setDuration(route.legs[0].duration.text);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(decodedPoints, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }

      minimizeInputContainer();
    } catch (error) {
      console.error('Error fetching directions:', error);
      let errorMessage = "An error occurred while fetching directions. Please try again.";
      if (error.message === "ZERO_RESULTS") {
        errorMessage = "No route found between the given locations.";
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const decodePolyline = (encoded) => {
    let index = 0, lat = 0, lng = 0, coordinates = [];
    const len = encoded.length;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return coordinates;
  };

  const renderPredictions = (predictions, setLocation, clearPredictions) => {
    return predictions.map((prediction) => (
      <TouchableOpacity
        key={prediction.place_id}
        style={styles.prediction}
        onPress={() => {
          setLocation(prediction.description);
          clearPredictions([]);
        }}
      >
        <Text style={styles.predictionText}>{prediction.description}</Text>
      </TouchableOpacity>
    ));
  };

  const minimizeInputContainer = () => {
    setIsInputMinimized(true);
    Animated.timing(inputContainerHeight, {
      toValue: 60,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const maximizeInputContainer = () => {
    setIsInputMinimized(false);
    Animated.timing(inputContainerHeight, {
      toValue: 250,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {userLocation && (
        <MapView
          ref={mapRef}
          initialRegion={userLocation}
        >
          <Marker coordinate={userLocation} title="You are here" />
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4A90E2"
            />
          )}
        </MapView>
      )}
      <View style={styles.overlay}>
        <Animated.View style={[styles.inputContainer, { height: inputContainerHeight }]}>
          {isInputMinimized ? (
            <TouchableOpacity style={styles.maximizeButton} onPress={maximizeInputContainer}>
              <Ionicons name="chevron-up" size={24} color="#4A90E2" />
              <Text style={styles.maximizeButtonText}>Show Route Options</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#4A90E2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Origin (leave blank for current location)"
                  value={origin}
                  onChangeText={setOrigin}
                  placeholderTextColor="#999"
                />
              </View>
              {renderPredictions(originPredictions, setOrigin, setOriginPredictions)}
              <View style={styles.inputWrapper}>
                <Ionicons name="navigate-outline" size={20} color="#4A90E2" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Destination"
                  value={destination}
                  onChangeText={setDestination}
                  placeholderTextColor="#999"
                />
              </View>
              {renderPredictions(destinationPredictions, setDestination, setDestinationPredictions)}
              <TouchableOpacity style={styles.button} onPress={getDirections}>
                <Text style={styles.buttonText}>Get Directions</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
        {distance && duration && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Distance: {distance}</Text>
            <Text style={styles.infoText}>Duration: {duration}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  maximizeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maximizeButtonText: {
    marginLeft: 10,
    color: '#4A90E2',
    fontSize: 16,
  },
  prediction: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  predictionText: {
    color: '#333',
  },
});
