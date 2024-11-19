const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase service account key
const serviceAccount = require('../campus-assistant-1286a-ba828c37806d.json');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Function to get coordinates of a school using Google Maps Geocoding API
async function getSchoolCoordinates(schoolName) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: schoolName,
        key: 'AIzaSyAIj35-PGEPMWbJzOfEVEtEWbp5ODsmteE',
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      console.log(`Coordinates for ${schoolName}: ${location.lat}, ${location.lng}`);
      return { latitude: location.lat, longitude: location.lng };
    } else {
      throw new Error(`No results found for school: ${schoolName}`);
    }
  } catch (error) {
    console.error(`Error fetching coordinates for ${schoolName}:`, error);
    throw error;
  }
}

// Generalized function to fetch and store places with a specific category
async function fetchAndStorePlacesByType(types, category, latitude, longitude, schoolName) {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes: types,
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: latitude,
              longitude: longitude,
            },
            radius: 1000.0, // 1km radius
          },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'AIzaSyAIj35-PGEPMWbJzOfEVEtEWbp5ODsmteE',
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.websiteUri,places.rating,places.photos.name',
        },
      }
    );

    const placesData = [];
    if (response.data && response.data.places) {
      for (const place of response.data.places) {
        const name = place.displayName.text || 'No name available';
        const address = place.formattedAddress || 'No address available';
        const rating = place.rating || 'No rating available';
        const types = place.types || ['No types available'];

        const photos = place.photos
          ? place.photos.map(
              (photo) =>
                `https://places.googleapis.com/v1/${photo.name}/media?key=AIzaSyAIj35-PGEPMWbJzOfEVEtEWbp5ODsmteE&maxHeightPx=400&maxWidthPx=400`
            )
          : [];

          const website = place.websiteUri || 'No website available';

        const firestorePlace = {
          name,
          address,
          rating,
          types: types.join(', '),
          photos,
          website,
          school: schoolName,
          category, // Single category for querying
          createdAt: new Date().toISOString(),
        };

        placesData.push(firestorePlace);

        // Store in Firestore under the "places" collection
        await db.collection('places').add(firestorePlace);
        console.log(`Inserted ${name} with ${photos.length} photos into places with category: ${category}`);
      }

      console.log(`Successfully processed ${placesData.length} places for category: ${category}`);
    } else {
      console.log(`No places found for category: ${category}`);
    }
  } catch (error) {
    console.error(`Error fetching places for category ${category}:`, error);
  }
}

// Main function to process operations for a given school name
(async () => {
  const schoolName = process.argv[2]; // Get school name from command-line arguments

  if (!schoolName) {
    console.error('Please provide a school name as a command-line argument.');
    process.exit(1); // Exit the script if no school name is provided
  }

  try {
    const { latitude, longitude } = await getSchoolCoordinates(schoolName);

    await fetchAndStorePlacesByType(['restaurant'], 'food', latitude, longitude, schoolName); // Food category
    await fetchAndStorePlacesByType(['gym'], 'gym', latitude, longitude, schoolName); // Gym category
    await fetchAndStorePlacesByType(['library'], 'library', latitude, longitude, schoolName); // Library category

    console.log('Data fetching completed');
  } catch (error) {
    console.error('Error during operation:', error);
  }
})();
