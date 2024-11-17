import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar, Animated, Alert, Image } from 'react-native';
import Mapbox, {LocationPuck, PointAnnotation} from "@rnmapbox/maps";
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import { decode } from '@mapbox/polyline';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks';
import printers from '../assets/printers.json'

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
  const [travelMode, setTravelMode] = useState('walking');
  const [navigationMode, setNavigationMode] = useState(false);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);
  const inputContainerHeight = useRef(new Animated.Value(60)).current;

  const accentColor = useAppSelector(state => state.user.accentColor);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
    const watchId = Geolocation.watchPosition(
      (position) => {
        const newLocation = [position.coords.longitude, position.coords.latitude];
        setUserLocation(newLocation);
        if (navigationMode) {
          updateCameraInNavigationMode(newLocation);
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
        heading: 0,
        animationDuration: 1000,
      });
    }
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

      setDirections(route.legs[0].steps);

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
        <Text style={styles.directionInstruction}>
          {index + 1}. {step.html_instructions.replace(/<[^>]*>/g, '')}
        </Text>
        <Text style={styles.directionInfo}>
          {step.distance.text} - {step.duration.text}
        </Text>
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
        <TouchableOpacity style={[styles.button, {backgroundColor: accentColor}]} onPress={startNavigation}>
          <Text style={[styles.buttonText, {backgroundColor: accentColor}]}>Start Navigation</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

const renderMarkers = () => {
  // Create refs object to store multiple marker refs
  const markerRefs = useRef({});
  return printers.map((printer, index) => {
      console.log(`Rendering marker ${index}:`, printer.coordinates);
      return (
        <Mapbox.PointAnnotation
          ref={ref => (markerRefs.current[printer.key] = ref)}
          key={printer.key}
          id={printer.key}
          coordinate={[printer.coordinates[1], printer.coordinates[0]]}
        >
          <View style={styles.markerContainer}>
            <Image
              source={require('../assets/printer.png')}
              style={{height: 20, width: 20}}
              onLoad={() => {
                // Check if ref exists and call refresh
                if (markerRefs.current[printer.key]) {
                  markerRefs.current[printer.key].refresh();
                }
              }}
            />
          </View>
        </Mapbox.PointAnnotation>
      );
    });
  };
  

  const renderNavigationInstruction = () => {
    if (travelMode === 'walking' || travelMode === 'bicycling') {
      return (
        <View style={styles.navigationInstruction}>
          <Text style={styles.navigationInstructionText}>Continue on the path.</Text>
        </View>
      );
    } else if (travelMode === 'transit') {
      // Find the first transit step
      const transitStep = directions.find(step => step.travel_mode === 'TRANSIT');
      
      if (transitStep && transitStep.transit_details) {
        const {
          line,
          departure_stop,
          arrival_stop,
          departure_time,
          arrival_time
        } = transitStep.transit_details;

        return (
          <View style={styles.navigationInstruction}>
            <Text style={styles.navigationInstructionText}>
              Take Bus #{line.short_name} ({line.name}){'\n'}
              From: {departure_stop.name}{'\n'}
              To: {arrival_stop.name}{'\n'}
              Departure: {departure_time.text}{'\n'}
              Arrival: {arrival_time.text}
            </Text>
          </View>
        );
      }
      
      return (
        <View style={styles.navigationInstruction}>
          <Text style={styles.navigationInstructionText}>
            No transit directions available.
          </Text>
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
          {renderMarkers()}
          {userLocation && (
              <Mapbox.LocationPuck
                type= 'position' // You can use 'normal', 'circle', or 'position'
                puckBearing= 'course'
                style={{
                  fillColor: 'red', // Puck color
                  fillOpacity: 0.5
                }}
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
                <TouchableOpacity style={[styles.modeButton, travelMode === 'walking' && {backgroundColor: accentColor}]} onPress={() => setTravelMode('walking')}>
                  <Text style={styles.modeText}>Walking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'bicycling' && {backgroundColor: accentColor}]} onPress={() => setTravelMode('bicycling')}>
                  <Text style={styles.modeText}>Cycling</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modeButton, travelMode === 'transit' && {backgroundColor: accentColor}]} onPress={() => setTravelMode('transit')}>
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
                <TouchableOpacity style={[styles.button, {backgroundColor: accentColor}]} onPress={getDirections}>
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
          {renderNavigationInstruction()}
          <View style = {styles.navigationControlsContainer}>
         <TouchableOpacity 
            style={[styles.navigationButton, {backgroundColor: accentColor}]} 
            onPress={() => setNavigationMode(false)}
          >
            <Text style={[styles.navigationButtonText, {backgroundColor: accentColor}]}>End Navigation</Text>
          </TouchableOpacity>
        </View>  
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
    position: 'relative',
    top: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    height: 200, // Adjust height as needed
    flex: 1
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
  navigationControlsContainer: {
    position: 'absolute',
    top: 700,
    left: 15,
    right: 15,
  },
  navigationButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navigationInstruction: {
    backgroundColor: 'white',
    minHeight: 120,              // Increased height for transit info
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8
},
navigationInstructionText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',         // Center align the text
    lineHeight: 20              // Add some line spacing
},

});