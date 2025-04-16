import { supabase } from '../../services/supabase';
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env'; // if using dotenv

async function getCoordinatesFromAddressMapbox(addressString) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    addressString
  )}.json?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`;

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

    // 🔍 Get coordinates using Mapbox
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
