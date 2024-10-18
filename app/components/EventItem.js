import { Linking, TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export default function EventItem({ event }) {
  const handlePress = () => {
    if (event.link) {
      Linking.openURL(event.link);
    }
  };

  return (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{event.event_title}</Text>
      <Text style = {styles.date}>{event.date}</Text>
      <Text>{event.location}</Text>
      <Text>{'\n'}</Text>
      <Text>{event.description}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  eventItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#ff4d4d', // Red accent
    borderRadius: 30,
    borderColor: '#ff1a1a', // Darker red for border
    borderWidth: 2,
    alignItems: 'center',
  },
  date: {
    fontStyle: 'italic',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});