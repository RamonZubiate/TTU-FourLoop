import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';

const API_KEY = 'AIzaSyDM0gtefOoLDFqaXmflGiKJPlRu2CTymhM'; // Be sure to secure this key!

const MapScreen = () => {
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [route, setRoute] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({}); //Should be a constant resource using Redux
            setOrigin({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })();
    }, []);

    useEffect(() => {
        if (origin && destination) {
            fetchRoute();
        }
    }, [origin, destination]);

    const fetchRoute = async () => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${API_KEY}`
            );
            const data = await response.json();
            if (data.routes.length > 0) {
                const points = decodePolyline(data.routes[0].overview_polyline.points);
                setRoute(points);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        }
    };

    // Helper function to decode Google's polyline encoding
    const decodePolyline = (encoded) => {
        const poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            poly.push({ latitude: lat / 1E5, longitude: lng / 1E5 });
        }
        return poly;
    };

    return (
        <View style={styles.container}>
            <GooglePlacesAutocomplete
                placeholder="Enter destination"
                onPress={(data, details = null) => {
                    setDestination({
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                    });
                }}
                query={{
                    key: API_KEY,
                    language: 'en',
                }}
                styles={{
                    container: styles.autocompleteContainer,
                    textInput: styles.autocompleteInput,
                }}
                fetchDetails={true}
            />
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                region={origin ? {
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                } : null}
            >
                {origin && <Marker coordinate={origin} title="Origin" />}
                {destination && <Marker coordinate={destination} title="Destination" />}
                {route && (
                    <Polyline
                        coordinates={route}
                        strokeColor="#000"
                        strokeWidth={3}
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    autocompleteContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 1,
    },
    autocompleteInput: {
        height: 40,
        fontSize: 16,
    },
});

export default MapScreen;