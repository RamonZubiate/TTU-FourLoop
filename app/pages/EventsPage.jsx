import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import EventItem from '../components/EventItem';
import { db } from '../firebaseConfig.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsCollection = collection(db, 'events');
                const eventsQuery = query(eventsCollection, orderBy('timestamp')); // Ensure 'date' is in correct format
                const snapshot = await getDocs(eventsQuery);
                const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(eventsData);
            } catch (err) {
                setError('Failed to fetch events: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" color="#eb4034" />;
    }

    if (error) {
        return <Text>Error: {error}</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/texas-tech-logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.headerTitle}>Texas Tech Events</Text>
            </View>

            {/* Event List */}
            <FlatList
                data={events}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <EventItem event={item} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
});

export default EventsPage;