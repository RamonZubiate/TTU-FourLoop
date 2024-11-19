import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking
} from "react-native";
import EventItem from "../components/EventItem";
import { db } from "../firebaseConfig.js";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../hooks';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation()

  const handlePress = (link) => {
    if (link) {
      Linking.openURL(link);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('PlacesList', {
      places: places,
      category: category,
    });
  };
  

  const {accentColor, school} = useAppSelector(state => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!school) {
          throw new Error("School is not defined in the Redux store.");
        }
  
        const eventsCollection = collection(db, "events");
        const eventsQuery = query(eventsCollection,orderBy("timestamp")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Fetch places data filtered by school
        const placesCollection = collection(db, "places");
        const placesQuery = query(
          placesCollection,
          where("school", "==", school) // Add the where clause for filtering places
        );
        const placesSnapshot = await getDocs(placesQuery);
        const placesData = placesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setEvents(eventsData);
        setPlaces(placesData);
      } catch (err) {
        setError("Failed to fetch data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [school]); // Add school as a dependency
  

  const renderPlaceBubbles = (category) => {
    const filteredPlaces = places.filter(place => {
      switch (category) {
        case "Food":
          return place.category === "food";
        case "Recreation":
          return place.category === "gym";
        case "Library":
          return place.category === "library";
        default:
          return false;
      }
    });

    // Show only first 2 places
    const visiblePlaces = filteredPlaces.slice(0, 3);
    const remainingCount = filteredPlaces.length - 2;

    return (
      <View style={styles.bubblesContainer}>
        <View style={styles.bubblesList}>
          {visiblePlaces.map((place) => (
            <View key={place.id} style={[styles.bubble, {backgroundColor: accentColor}]}>
              <Text style={styles.bubbleText}>{place.name}</Text>
            </View>
          ))}
          {remainingCount > 0 && (
            <View style={[styles.bubble, styles.countBubble]}>
              <Text style={styles.bubbleText}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color={accentColor} />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  const parseEventDate = (dateString) => {
    if (!dateString) return { dayRange: "TBA", month: "", timeRange: "TBA" };
  
    const parts = dateString.split(", ");
    const dayPart = parts[1] ? parts[1].trim() : "TBA";
    const timePart = parts[2] ? parts[2].trim() : "TBA";
  
    const multiDayMatch = dayPart.match(/(\d+)(?:.*–.*(\d+))?/);
    const startDay = multiDayMatch ? multiDayMatch[1] : "TBA";
    const endDay = multiDayMatch && multiDayMatch[2] ? multiDayMatch[2] : "";
  
    const dayRange = endDay ? `${startDay}-${endDay}` : startDay;
    const monthAbbreviation = parts[1] ? parts[1].split(" ")[0].slice(0, 3).toUpperCase() : "";
  
    const timeRangeMatch = timePart.match(/(\d+.*\b(?:AM|PM)?\b)\s*–\s*(\d+.*\b(?:AM|PM)?\b)/i);
    const timeRange = timeRangeMatch ? `${timeRangeMatch[1].toUpperCase()} - ${timeRangeMatch[2].toUpperCase()}` : "TBA";
  
    return {
      dayRange: dayRange,
      month: monthAbbreviation,
      timeRange: timeRange,
    };
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.eventsTitle, { marginTop: 80 }]}>Discover</Text>
      <FlatList
        data={[
          { id: "1", title: "Food", image: require("../assets/food.jpg") },
          { id: "2", title: "Recreation", image: require("../assets/recreation.jpg") },
          { id: "3", title: "Library", image: require("../assets/library.jpg") },
        ]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.categoryCardWrapper}
            onPress={() => handleCategoryPress(item.title)}
          >
            <View style={styles.categoryCard}>
              <Image source={item.image} style={styles.categoryImage} />
              <Text style={styles.categoryText}>{item.title}</Text>
              {renderPlaceBubbles(item.title)}
            </View>
          </TouchableOpacity>
        )}
        style={styles.categoryList}
      />

      {/* Rest of the component remains the same */}
      <Text style={styles.eventsTitle}>Events</Text>

      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const { dayRange, month, timeRange } = parseEventDate(item.date);

          return (
            <View style={styles.eventCard}>
              <View style={styles.eventBackground}>
                <Image
                  source={require("../assets/ttu-campus-2022.jpg")}
                  style={styles.eventCardImage}
                />
              </View>
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.eventCardTitle}
              >
                {item.event_title}
              </Text>
              <Text style={styles.eventDate}>{timeRange}</Text>
              <View style={styles.dateCard}>
                <Text style={[styles.dateDay, {color: accentColor}]}>{dayRange}</Text>
                <Text style={[styles.dateMonth, {color: accentColor}]}>{month}</Text>
              </View>
              <TouchableOpacity
                style={[styles.learnMoreButton, {backgroundColor: accentColor}]}
                onPress={() => handlePress(item.link)}
              >
                <Text style={styles.learnMoreButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        style={styles.eventList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryCardWrapper: {
    marginRight: 16,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 300,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    height: 310,
    top: 2.5,
  },
  categoryImage: {
    width: "100%",
    height: "50%",
  },
  categoryText: {
    padding: 20,
    fontSize: 28,
    fontWeight: "600",
    color: "#333",
    textAlign: "left",
  },


  countBubble: {
    backgroundColor: 'black',
  },
  bubbleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: "bold",
   // fontWeight: '600',
  },
  // ... rest of the styles remain the same
  eventsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  eventList: {
    //marginTop: 10,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 165,
    height: 220,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  eventCardImage: {
    width: "100%",
    height: 100,
    resizeMode: "contain",
  },
  eventCardTitle: {
    padding: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "left"
  },
  eventBackground: {
    backgroundColor: "transparent",
    width: "100%",
    alignContent: "center",
    alignItems: "center",
  },
  eventDate: {
    fontSize: 14,
    fontWeight: "normal",
    color: "black",
    marginTop: -5,
  },
  learnMoreButton: {
    width: "90%",
    padding: 5,
    backgroundColor: "#CC0000",
    borderRadius: 5,
    position: "absolute",
    bottom: 20
  },
  learnMoreButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  dateCard: {
    backgroundColor: "white",
    width: 40,
    height: 50,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
  },
  dateDay: {
    color: "#CC0000",
    fontWeight: "bold",
    fontSize: 16,
  },
  dateMonth: {
    color: "#CC0000",
    fontWeight: "600",
    fontSize: 12,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 300,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    height: 350,  // Increased from 310 to accommodate bubbles
    top: 2.5,
  },
  categoryImage: {
    width: "100%",
    height: "45%",  // Slightly reduced to give more space for bubbles
  },
  categoryText: {
    padding: 15,    // Reduced padding to give more space
    fontSize: 28,
    fontWeight: "600",
    color: "#333",
    textAlign: "left",
  },
  bubblesContainer: {
    paddingHorizontal: 20,
    marginTop: -5,
    minHeight: 100,  // Set minimum height to ensure all bubbles are visible
    maxHeight: 120,  // Set maximum height to maintain consistent card size
  },
  bubblesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,         // Increased gap slightly
  },
  bubble: {
    backgroundColor: '#CC0000',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 5,  // Reduced margin bottom
  }
});

export default EventsPage;