import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import FastImage from 'react-native-fast-image';
import { ChevronLeft } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import PlaceBusyness from '../components/PlaceBusyness'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GalleryImageProps {
  uri: string;
}

const GalleryImage: React.FC<GalleryImageProps> = ({ uri }) => (
  <View style={styles.slideContainer}>
    <FastImage
      source={{ uri }}
      style={styles.fullImage}
      resizeMode={FastImage.resizeMode.contain}
    />
  </View>
);

interface ImageGalleryProps {
  images: string[];
  visible: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  visible, 
  onClose, 
  initialIndex = 0 
}) => {
  const flatListRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [visible, initialIndex]);

  const onScroll = useCallback((event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentIndex(Math.round(index));
  }, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  }), []);

  const onScrollToIndexFailed = useCallback((info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const wait = new Promise<void>((resolve: () => void) => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false
      });
    });
  }, [initialIndex]);

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
        
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onScrollToIndexFailed={onScrollToIndexFailed}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          renderItem={({ item }) => (
            <View style={styles.slideContainer}>
              <FastImage
                source={{ uri: item }}
                style={styles.fullImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
        />
        
        <Text style={styles.pagination}>
          {currentIndex + 1} / {images.length}
        </Text>
      </SafeAreaView>
    </Modal>
  );
};
interface Place {
  id: string;
  name: string;
  rating: number;
  address?: string;
  photos?: string[];
  category: string;
}

interface PlacesListPageProps {
  route: {
    params: {
      places: Place[];
      category: string;
    };
  };
}

const PlacePhoto: React.FC<{ uri: string; onPress: () => void }> = ({ uri, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <FastImage
      source={{ uri }}
      style={styles.thumbnail}
      resizeMode={FastImage.resizeMode.cover}
    />
  </TouchableOpacity>
);

const PlacesListPage: React.FC<PlacesListPageProps> = ({ route }) => {
  const navigation = useNavigation();
  const { places, category } = route.params;
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

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleRatingChange = useCallback((id: string, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [id]: Math.round(value * 10) / 10,
    }));
  }, []);

  const openGallery = (photos: string[], initialIndex: number) => {
    setSelectedImages(photos);
    setSelectedImageIndex(initialIndex);
    setModalVisible(true);
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <View style={styles.placeCard}>
      <View style={styles.placeContent}>
        <Text style={styles.placeName}>{item.name}</Text>
        
        <View style={styles.starsContainer}>
          <Text style={[styles.placeAddress, styles.ratingText]}>
            {item.rating ? item.rating : 'No rating available'}
          </Text>
          
          {typeof item.rating === 'number' && (
            <Rating
              size={14}
              maxRating={5}
              rating={ratings[item.id] || item.rating}
              onChange={(value) => handleRatingChange(item.id, value)}
              baseColor="#C7C7CC"
              fillColor="#FFD700"
            />
          )}
        </View>
  
        {item.address  && (
          <Text style={styles.placeAddress}>{item.address}</Text>
        )}
  
        {/* Add the PlaceBusyness component */}
        {item.address && (
          <PlaceBusyness name={item.name} address={item.address} />
        )}
  
        {item.photos && item.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
            {item.photos.map((photo, index) => (
              <PlacePhoto
                key={index}
                uri={photo}
                onPress={() => openGallery(item.photos!, index)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
  

  return (
    <View style={styles.container}>
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="black" width={24} height={24} />
        </TouchableOpacity>
        
        <Text numberOfLines={1} style={styles.title}>
          {category}
        </Text>
      </View>
     

      <FlatList
        data={filteredPlaces}
        renderItem={renderPlaceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <ImageGallery
        images={selectedImages}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialIndex={selectedImageIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },

  listContainer: {
    paddingBottom: 20,
  },
  placeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  placeContent: {
    padding: 15,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 14,
    color: '#888',
  },
  ratingText: {
    color: 'black',
    fontSize: 14,
    top: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: -2.5,
    marginBottom: 7.5,
    alignItems: 'center',
    gap: 5,
  },
  photoContainer: {
    marginTop: 10,
    marginHorizontal: -5,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: StatusBar.currentHeight || 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
  },
  pagination: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: 'white',
    fontSize: 16,
  },
  headerContainer: {
    height: 44,
    marginTop: 40,
    marginBottom: 10,
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon height to center
    zIndex: 1,
  },
});

export default PlacesListPage;