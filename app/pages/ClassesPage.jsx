import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    ActivityIndicator,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Linking,
    Modal,
    TextInput,
    Alert,
} from "react-native";

const ClassesPage = () => {
    const [classes, setClasses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newClass, setNewClass] = useState({
        name: '',
        location: '',
        time: ''
    });

    const handleAddClass = () => {
        if (newClass.name && newClass.location && newClass.time) {
            setClasses([...classes, { ...newClass, id: Date.now().toString() }]);
            setNewClass({ name: '', location: '', time: '' });
            setModalVisible(false);
        } else {
            Alert.alert("Missing Information", "Please fill in all fields");
        }
    };

    const handleDeleteClass = (classId) => {
        Alert.alert(
            "Delete Class",
            "Are you sure you want to delete this class?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: () => {
                        setClasses(classes.filter(item => item.id !== classId));
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderClassItem = ({ item }) => (
        <View style={styles.classCard}>
            <View style={styles.classInfo}>
                <Text style={styles.className}>{item.name}</Text>
                <View style={styles.classDetails}>
                    <Text style={styles.classLocation}>📍 {item.location}</Text>
                    <Text style={styles.classTime}>🕒 {item.time}</Text>
                </View>
            </View>
            <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteClass(item.id)}
            >
                <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>View Class Schedule</Text>
                
                <FlatList
                    data={classes}
                    renderItem={renderClassItem}
                    keyExtractor={item => item.id}
                    style={styles.classList}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No classes added yet</Text>
                    }
                />
            </View>

            {/* Add Class Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Class</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Class Name"
                            placeholderTextColor="#666"
                            value={newClass.name}
                            onChangeText={(text) => setNewClass({...newClass, name: text})}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Location"
                            placeholderTextColor="#666"
                            value={newClass.location}
                            onChangeText={(text) => setNewClass({...newClass, location: text})}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Time (e.g., 9:00 AM)"
                            placeholderTextColor="#666"
                            value={newClass.time}
                            onChangeText={(text) => setNewClass({...newClass, time: text})}
                        />

                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setNewClass({ name: '', location: '', time: '' });
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.submitButton}
                                onPress={handleAddClass}
                            >
                                <Text style={styles.submitButtonText}>Add Class</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Add Class Button */}
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.buttonText}>Add Class</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    classList: {
        flex: 1,
    },
    classCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    classInfo: {
        flex: 1,
    },
    className: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    classDetails: {
        flexDirection: 'column',
        gap: 4,
    },
    classLocation: {
        fontSize: 16,
        color: '#666',
    },
    classTime: {
        fontSize: 16,
        color: '#666',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ff3b30',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 24,
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1a1a1a',
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        padding: 15,
        marginBottom: 16,
        fontSize: 16,
        color: '#1a1a1a',
    },
    modalButtonsContainer: {
        marginTop: 8,
        flexDirection: 'column',
        gap: 12,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f3f5',
        paddingVertical: 16,
        borderRadius: 12,
    },
    cancelButtonText: {
        color: '#495057',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ClassesPage;