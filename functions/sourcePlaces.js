const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase service account key
const serviceAccount = require('../campus-assistant-1286a-da82cf5ebe36.json');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function fetchAndStorePlaces() {
  try {
    const latitude = 33.5841;  // Texas Tech University coordinates
    const longitude = -101.8798;

    // Fetch data from Google Places API
    const response = await axios.post('https://places.googleapis.com/v1/places:searchNearby', {
      "includedTypes": ["restaurant"],
      "excludedTypes": ["bar"],
      "maxResultCount": 20,
      "locationRestriction": {
        "circle": {
          "center": {
            "latitude": latitude,
            "longitude": longitude
          },
          "radius": 1000.0
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyAIj35-PGEPMWbJzOfEVEtEWbp5ODsmteE',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.websiteUri,places.rating,places.photos.name'
      }
    });

    const placesData = [];
    if (response.data && response.data.places) {
      for (const place of response.data.places) {
        const name = place.displayName.text || "No name available";
        const address = place.formattedAddress || "No address available";
        const rating = place.rating || "No rating available";
        const types = place.types || ["No types available"];
        const school = "Texas Tech University";
        
        // Get photo references directly
        const photos = place.photos 
          ? place.photos.map(photo => `https://places.googleapis.com/v1/${photo.name}/media?key=AIzaSyAIj35-PGEPMWbJzOfEVEtEWbp5ODsmteE&maxHeightPx=400&maxWidthPx=400`)
          : [];
        
        // Prepare Firestore document data
        const firestorePlace = {
          name,
          address,
          rating,
          types: types.join(", "),
          photos,
          school,
          createdAt: new Date().toISOString()
        };

        placesData.push(firestorePlace);
        
        // Store in Firestore
        await db.collection('places').add(firestorePlace);
        console.log(`Inserted ${name} with ${photos.length} photos`);
      }

      console.log(`Successfully processed ${placesData.length} places`);
    } else {
      console.log("No places found in the response.");
    }
  } catch (error) {
    console.error("Error fetching places:", error);
  }
}

// Call the function
fetchAndStorePlaces()
  .then(() => console.log("Data fetching completed"))
  .catch((error) => console.error("Error in data fetching:", error));