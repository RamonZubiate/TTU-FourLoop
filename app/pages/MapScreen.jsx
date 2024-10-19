import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar, Animated, Alert } from 'react-native';
import Mapbox from "@rnmapbox/maps";
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { decode } from '@mapbox/polyline';

const GOOGLE_API_KEY = "AIzaSyDM0gtefOoLDFqaXmflGiKJPlRu2CTymhM";
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoicmF6bW9uIiwiYSI6ImNtMmV2NDBoMTAyZjIya3EwOWt0bm85Z20ifQ.aBMg6GRjL1Zo3d2foxkOvg";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

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
  const [directions, setDirections] = useState([]);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const inputContainerHeight = useRef(new Animated.Value(250)).current;

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        console.error('Error fetching location:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const getAutocomplete = async (input, setPredictions) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_API_KEY}`
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
      const startPoint = origin || `${userLocation[1]},${userLocation[0]}`;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint}&destination=${destination}&key=${GOOGLE_API_KEY}`
      );

      if (response.data.status !== "OK") {
        throw new Error(response.data.status);
      }

      const route = response.data.routes[0];
      const points = route.overview_polyline.points;
      const decodedPoints = decode(points);

      setRouteCoordinates(decodedPoints.map(point => [point[1], point[0]]));
      setDistance(route.legs[0].distance.text);
      setDuration(route.legs[0].duration.text);
      setDirections(route.legs[0].steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text
      })));

      if (cameraRef.current) {
        cameraRef.current.fitBounds(
          [decodedPoints[0][1], decodedPoints[0][0]],
          [decodedPoints[decodedPoints.length - 1][1], decodedPoints[decodedPoints.length - 1][0]],
          50,
          1000
        );
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

  const renderDirections = () => {
    return directions.map((step, index) => (
      <View key={index} style={styles.directionStep}>
        <Text style={styles.directionInstruction}>{index + 1}. {step.instruction.replace(/<[^>]*>/g, '')}</Text>
        <Text style={styles.directionInfo}>{step.distance} - {step.duration}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
      <Mapbox.MapView
  ref={mapRef}
  style={styles.map}
  styleURL="mapbox://styles/razmon/cm2eva4lk00b201pdc5j6hk1q">
  <Mapbox.Camera
    ref={cameraRef}
    zoomLevel={14}
    pitch={45} // Adds a 3D effect
    centerCoordinate={userLocation}
  />
  {userLocation && (
    <Mapbox.PointAnnotation
      id="userLocation"
      coordinate={userLocation}
      title="You are here"
    />
  )}
  {routeCoordinates.length > 0 && (
    <Mapbox.ShapeSource id="routeSource" shape={{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates
      }
    }}>
      <Mapbox.LineLayer
        id="routeFill"
        style={{
          lineColor: '#4A90E2',
          lineWidth: 4,
          lineCap: Mapbox.LineJoin.Round,
          lineJoin: Mapbox.LineJoin.Round
        }}
      />
    </Mapbox.ShapeSource>
  )}
</Mapbox.MapView>
      </View>
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
      {directions.length > 0 && (
        <View style={styles.directionsContainer}>
          <ScrollView>
            <Text style={styles.directionsTitle}>Turn-by-Turn Directions:</Text>
            {renderDirections()}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
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
    marginTop: 10,
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
  directionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    maxHeight: '30%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  directionStep: {
    marginBottom: 10,
  },
  directionInstruction: {
    fontSize: 16,
    color: '#333',
  },
  directionInfo: {
    fontSize: 14,
    color: '#666',
  },
});