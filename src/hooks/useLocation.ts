import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { WorkLocation } from '../types';

const getDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useLocation = (workLocation?: WorkLocation, autoMode = false) => {
  const [isAtWork, setIsAtWork] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  useEffect(() => {
    if (!autoMode || !workLocation || !hasPermission) {
      watchRef.current?.remove();
      return;
    }

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
      ({ coords }) => {
        const dist = getDistance(
          coords.latitude, coords.longitude,
          workLocation.latitude, workLocation.longitude
        );
        setIsAtWork(dist <= workLocation.radius);
      }
    ).then(sub => {
      watchRef.current = sub;
    });

    return () => {
      watchRef.current?.remove();
    };
  }, [autoMode, workLocation, hasPermission]);

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!hasPermission) return null;
    const { coords } = await Location.getCurrentPositionAsync({});
    return { latitude: coords.latitude, longitude: coords.longitude };
  };

  return { isAtWork, hasPermission, getCurrentLocation };
};
