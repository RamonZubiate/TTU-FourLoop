import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { selectSchool } from '../slice'

const SchoolSelectPage = ({ navigation }) => {
  const dispatch = useDispatch();
  const { school, isLoading, error, accentColor } = useSelector((state) => state.user);

  const handleSchoolChange = (value) => {
    if (value !== school) {
      dispatch(selectSchool(value));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Select Your School</Text>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={school}
            onValueChange={handleSchoolChange}
            enabled={!isLoading}
            style={styles.picker}
          >
            <Picker.Item label="Select a school" value="" />
            <Picker.Item 
              label="Texas Tech University" 
              value="Texas Tech University" 
            />
            <Picker.Item 
              label="University of Texas" 
              value="University of Texas" 
            />
          </Picker>
        </View>

        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color={accentColor || '#000'} 
            style={styles.loader} 
          />
        )}

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {school && !isLoading && (
          <View style={styles.selectedSchool}>
            <Text style={styles.selectedLabel}>Selected School:</Text>
            <Text style={styles.schoolName}>{school}</Text>
            <View 
              style={[
                styles.colorIndicator, 
                { backgroundColor: accentColor }
              ]} 
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 20,
  },
  picker: {
    height: 50,
  },
  loader: {
    marginVertical: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  selectedSchool: {
    alignItems: 'center',
    marginTop: 20,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  schoolName: {
    fontSize: 18,
    marginTop: 5,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: 10,
  },
});

export default SchoolSelectPage;