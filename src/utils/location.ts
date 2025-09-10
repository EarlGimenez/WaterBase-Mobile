export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    village?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  importance?: number;
}

export const formatDisplayName = (result: NominatimResult): string => {
  const { address } = result;
  let parts: string[] = [];

  // Add specific location details
  if (address?.village) parts.push(address.village);
  if (address?.city) parts.push(address.city);
  if (address?.municipality && !address?.city) parts.push(address.municipality);
  if (address?.county && !parts.includes(address.county)) parts.push(address.county);

  // Always include state (region) and country if available
  if (address?.state) parts.push(address.state);
  if (address?.country) parts.push(address.country);

  return parts.length > 0 ? parts.join(', ') : result.display_name;
};

/**
 * Fetch address from coordinates using Nominatim reverse geocoding
 */
export const fetchAddressFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WaterBase-Mobile/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NominatimResult = await response.json();
    console.log('Reverse Geocoding Response:', data);
    
    if (data && data.display_name) {
      return formatDisplayName(data);
    } else {
      throw new Error('No address found');
    }
  } catch (error) {
    console.error('Error fetching address:', error);
    throw error;
  }
};

/**
 * Get current location using device GPS
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get current location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};
