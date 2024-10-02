import React, {useState} from 'react';
import { useNavigation,NavigationProp } from '@react-navigation/native';
import {View,Text,Button} from 'react-native'





const EventsPage = () => {
    const navigation = useNavigation();


    return ( 
      <View>
            <Text>Events Page</Text>

            <Button
                title='Go to Home Page'
                onPress={() => navigation.navigate('HomePage')}
            
            />
      </View>
    )

}


export default EventsPage







