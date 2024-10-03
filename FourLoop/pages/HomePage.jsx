import React,{useState} from 'react';
import { useNavigation } from '@react-navigation/native';
import {View,Text,Button} from 'react-native'


const HomePage = () => {
    const navigation = useNavigation();

    return (
        <View>
            <Text>Home Page</Text>
            <Button 
                title='Go To Maps Page'
                onPress={() => navigation.navigate('MapScreen')}
            
            />
        </View>
    )
}


export default HomePage