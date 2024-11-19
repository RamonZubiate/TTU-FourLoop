import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Types for the Live API response
interface LiveBusynessResponse {
  status: string;
  analysis: {
    venue_forecasted_busyness: number;
    venue_live_busyness: number;
    venue_live_busyness_available: boolean;
    venue_live_forecasted_delta: number;
  };
  venue_info: {
    venue_current_localtime: string;
    venue_name: string;
  };
}

// Custom hook to fetch live busyness data
const useLiveBusynessData = (venueName: string, venueAddress: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busynessData, setBusynessData] = useState<LiveBusynessResponse | null>(null);

  useEffect(() => {
    const fetchLiveBusyness = async () => {
      try {
        const params = new URLSearchParams({
          api_key_private: 'pri_764669e1c4df43288542185db47c03f7',
          venue_name: venueName,
          venue_address: venueAddress
        });

        const response = await fetch(
          `https://besttime.app/api/v1/forecasts/live?${params}`,
          { method: 'POST' }
        );

        const data = await response.json();

        if (data.status === 'OK') {
          setBusynessData(data);
        } else {
          setError(`Failed to fetch busyness data: ${data.message || 'Unknown error'}`);
        }
      } catch (err) {
        setError(`Error fetching busyness data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveBusyness();
  }, [venueName, venueAddress]);

  return { busynessData, loading, error };
};

// Busyness meter component
const BusynessMeter: React.FC<{
  liveBusyness: number;
  forecastedBusyness: number;
}> = ({ liveBusyness, forecastedBusyness }) => {
  const getBusynessLevel = (value: number) => {
    if (value >= 75) return { text: 'Very Busy', color: '#FF4444' };
    if (value >= 50) return { text: 'Busy', color: '#FFA000' };
    if (value >= 25) return { text: 'Average', color: '#4CAF50' };
    return { text: 'Not Busy', color: '#2196F3' };
  };

  const liveLevel = getBusynessLevel(liveBusyness);
  const delta = liveBusyness - forecastedBusyness;

  return (
    <View style={styles.meterContainer}>
      <View style={[styles.statusBadge, { backgroundColor: liveLevel.color }]}>
        <Text style={styles.statusText}>{liveLevel.text}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.busynessText}>{liveBusyness}% current capacity</Text>
        <Text style={styles.deltaText}>
          {Math.abs(delta)}% {delta >= 0 ? 'busier' : 'quieter'} than usual
        </Text>
      </View>
    </View>
  );
};

// Main busyness component
// Main busyness component
const PlaceBusyness: React.FC<{
  name: string;
  address: string;
}> = ({ name, address }) => {
  const { busynessData, loading, error } = useLiveBusynessData(name, address);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text style={styles.loadingText}>Loading busyness data...</Text>
      </View>
    );
  }

  if (error || !busynessData?.analysis) {
    return (
      <View style={styles.container}>
        <Text>Live data not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BusynessMeter
        liveBusyness={busynessData.analysis.venue_live_busyness}
        forecastedBusyness={busynessData.analysis.venue_forecasted_busyness}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  meterContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsContainer: {
    gap: 4,
  },
  busynessText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  deltaText: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 5,
    textAlign: 'center',
    color: '#666',
  }
});

export default PlaceBusyness;