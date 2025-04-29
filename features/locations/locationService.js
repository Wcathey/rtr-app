import { supabase } from '../../services/supabase';
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env'; // if using dotenv

async function getCoordinatesFromAddressMapbox(addressString) {
  // 🔍 Limit to one U.S. address result
  const url = [
    `https://api.mapbox.com/geocoding/v5/mapbox.places/`,
    `${encodeURIComponent(addressString)}.json`,
    `?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`,
    `&limit=1`,
    `&types=address`,
    `&country=us`
  ].join('');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Mapbox request failed:', await response.text());
      throw new Error('Failed to fetch coordinates');
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No coordinates found for the given address.');
    }

    const [longitude, latitude] = data.features[0].center;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid geocode response.');
    }

    return { latitude, longitude };
  } catch (err) {
    console.error('Mapbox geocoding failed:', err);
    throw err;
  }
}

export async function createLocation({ address, optional_address_ext = null, city, state, zipcode }) {
  try {
    if (!address || !city || !state || !zipcode) {
      throw new Error('Address, city, state, and zipcode are required.');
    }

    const fullAddress = `${address}${optional_address_ext ? ` ${optional_address_ext}` : ''}, ${city}, ${state} ${zipcode}`;

    // 🔍 Get coordinates using Mapbox (now limited & typed)
    const { latitude, longitude } = await getCoordinatesFromAddressMapbox(fullAddress);

    // 📍 Insert into Supabase
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        address,
        optional_address_ext,
        city,
        state,
        zipcode,
        latitude,
        longitude,
      }])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error creating location:', err);
    throw err;
  }
}

/**
 * Get driving distance (miles) and duration (minutes) between two points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {Promise<{distance_miles: number, duration_min: number}>}
 */
export async function getDrivingRoute(lat1, lon1, lat2, lon2) {
  const url = [
    `https://api.mapbox.com/directions/v5/mapbox/driving/`,
    `${lon1},${lat1};${lon2},${lat2}`,
    `?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`,
    `&overview=false&geometries=polyline&annotations=distance,duration`
  ].join('');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions API error ${res.status}`);
  const json = await res.json();
  const route = json.routes?.[0];
  if (!route) throw new Error('No route found');

  return {
    distance_miles: route.distance / 1609.34,
    duration_min:   route.duration / 60,
  };
}

export async function getRoute(origin, destination) {
  const url =
  `https://api.mapbox.com/directions/v5/mapbox/driving/` +
  `${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
  `?overview=full&geometries=geojson&steps=true` +
  `&access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`;

  const res = await fetch(url);
  const json = await res.json();
  if (!json.routes || !json.routes.length) throw new Error('No route');
  return json.routes[0]; // contains .geometry and .legs[0].steps
}
