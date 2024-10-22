import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar, Animated, Alert } from 'react-native';
import Mapbox from "@rnmapbox/maps";
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
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
  const [showDirections, setShowDirections] = useState(false);
  const [destinationPredictions, setDestinationPredictions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [directions, setDirections] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [travelMode, setTravelMode] = useState('driving');
  const [navigationMode, setNavigationMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const inputContainerHeight = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
    const watchId = Geolocation.watchPosition(
      (position) => {
        const newLocation = [position.coords.longitude, position.coords.latitude];
        setUserLocation(newLocation);
        if (navigationMode) {
          updateCameraInNavigationMode(newLocation);
          checkForNextStep(newLocation);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [navigationMode]);

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

  const updateCameraInNavigationMode = (location) => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: location,
        zoomLevel: 18,
        pitch: 60,
        heading: calculateHeading(location),
        animationDuration: 1000,
      });
    }
  };

  const calculateHeading = (location) => {
    if (routeCoordinates.length < 2) return 0;
    const nextPoint = routeCoordinates[Math.min(currentStep + 1, routeCoordinates.length - 1)];
    const dx = nextPoint[0] - location[0];
    const dy = nextPoint[1] - location[1];
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const checkForNextStep = (location) => {
    if (currentStep < directions.length - 1) {
      const nextStepCoords = routeCoordinates[currentStep + 1];
      const distanceToNextStep = calculateDistance(location, nextStepCoords);
      if (distanceToNextStep < 0.05) { // 50 meters threshold
        setCurrentStep(prevStep => prevStep + 1);
      }
    }
  };

  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLon = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint}&destination=${destination}&mode=${travelMode}&key=${GOOGLE_API_KEY}`
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

      setShowDirections(true);
      setShowInfo(true);

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

  const renderDirections = () => {
    return directions.map((step, index) => (
      <View key={index} style={styles.directionStep}>
        <Text style={styles.directionInstruction}>{index + 1}. {step.instruction.replace(/<[^>]*>/g, '')}</Text>
        <Text style={styles.directionInfo}>{step.distance} - {step.duration}</Text>
      </View>
    ));
  };

  const startNavigation = () => {
    setNavigationMode(true);
    if (userLocation) {
      updateCameraInNavigationMode(userLocation);
    }
  };

  const renderNavigationButton = () => {
    if (showDirections && !navigationMode) {
      return (
        <TouchableOpacity style={styles.button} onPress={startNavigation}>
          <Text style={styles.buttonText}>Start Navigation</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderCurrentDirection = () => {
    if (navigationMode && directions.length > currentStep) {
      const currentDirection = directions[currentStep];
      return (
        <View style={styles.currentDirectionContainer}>
          <Text style={styles.currentDirectionText}>
            {currentDirection.instruction.replace(/<[^>]*>/g, '')}
          </Text>
          <Text style={styles.currentDirectionInfo}>
            {currentDirection.distance} - {currentDirection.duration}
          </Text>
        </View>
      );
    }
    return null;
  };

  
  const renderNextDirection = () => {
    if (navigationMode && directions.length > currentStep + 1) {
      const nextDirection = directions[currentStep + 1];
      return (
        <View style={styles.nextDirectionContainer}>
          <Text style={styles.nextDirectionText}>Next:</Text>
          <Text style={styles.nextDirectionInstruction}>
            {nextDirection.instruction.replace(/<[^>]*>/g, '')}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderNavigationControls = () => {
    if (navigationMode) {
      return (
        <View style={styles.navigationControlsContainer}>
          <TouchableOpacity 
            style={styles.navigationButton} 
            onPress={() => setCurrentStep(prevStep => Math.max(0, prevStep - 1))}
          >
            <Text style={styles.navigationButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navigationButton} 
            onPress={() => setCurrentStep(prevStep => Math.min(directions.length - 1, prevStep + 1))}
          >
            <Text style={styles.navigationButtonText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navigationButton} 
            onPress={() => setNavigationMode(false)}
          >
            <Text style={styles.navigationButtonText}>End Navigation</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          styleURL="mapbox://styles/mapbox/standard">
          <Mapbox.Camera
            ref={cameraRef}
            zoomLevel={18}
            pitch={60}
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
                  lineWidth: 10,
                  lineCap: Mapbox.LineJoin.Round,
                  lineJoin: Mapbox.LineJoin.Round
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </Mapbox.MapView>
      </View>
      <View style={styles.overlay}>
        {!navigationMode ? (
          <>
            <Animated.View style={[styles.inputContainer, { height: inputContainerHeight }]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  onPress={() => { setShowDirections(false); setShowInfo(false) }}
                  placeholder="Where are you going?"
                  value={destination}
                  onChangeText={setDestination}
                  placeholderTextColor="#999"
                />
              </View>
            </Animated.View>
            <View>
              {renderPredictions(destinationPredictions, setDestination, setDestinationPredictions)}
            </View>

            {destination !== '' && (
              <View style={styles.modeContainer}>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'driving' && styles.activeMode]} onPress={() => setTravelMode('driving')}>
                  <Text style={styles.modeText}>Driving</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'walking' && styles.activeMode]} onPress={() => setTravelMode('walking')}>
                  <Text style={styles.modeText}>Walking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'bicycling' && styles.activeMode]} onPress={() => setTravelMode('bicycling')}>
                  <Text style={styles.modeText}>Cycling</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'transit' && styles.activeMode]} onPress={() => setTravelMode('transit')}>
                  <Text style={styles.modeText}>Transit</Text>
                </TouchableOpacity>
              </View>
            )}

            {showInfo && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Distance: {distance}</Text>
                <Text style={styles.infoText}>Duration: {duration}</Text>
              </View>
            )}

            {destination !== '' && (
              <View>
                <TouchableOpacity style={styles.button} onPress={getDirections}>
                  <Text style={styles.buttonText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            )}

            {renderNavigationButton()}

            {showDirections && !navigationMode && (
              <ScrollView style={styles.directionsContainer}>
                {renderDirections()}
              </ScrollView>
            )}
          </>
        ) : (
          <>
            {renderCurrentDirection()}
            {renderNextDirection()}
            {renderNavigationControls()}
          </>
        )}
      </View>
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
    top: 0,
    width: '100%',
    padding: 10,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
    color: '#333',
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
    backgroundColor: 'white',
    color: '#333',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#ddd',
  },
  activeMode: {
    backgroundColor: '#4A90E2',
  },
  modeText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginVertical: 10,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  directionsContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    height: 200,
    top: 550
  },
  directionStep: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  directionInstruction: {
    fontSize: 16,
    color: '#333',
  },
  directionInfo: {
    fontSize: 14,
    color: '#999',
  },
  prediction: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white'
  },
  predictionText: {
    fontSize: 16,
    color: '#333',
  },
   currentDirectionContainer: {
    position: 'absolute',
    top: 20,
    left: 15,
    right: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  currentDirectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  currentDirectionInfo: {
    fontSize: 14,
    color: '#666',
  },
  nextDirectionContainer: {
    position: 'absolute',
    top: 120,
    left: 15,
    right: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
  },
  nextDirectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  nextDirectionInstruction: {
    fontSize: 14,
    color: '#666',
  },
  navigationControlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});