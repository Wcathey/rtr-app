// features/assignments/assignmentService.js
import { supabase } from '../../services/supabase';

/**
 * Fetches all “open” (pending) assignments along with their location details.
 */
export async function getOpenAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      description,
      base_price,
      tips,
      start_time,
      end_time,
      created_at,
      status,
      location:locations (
        id,
        latitude,
        longitude,
        address,
        optional_address_ext,
        city,
        state,
        zipcode
      )
    `)
    .eq('status', 'Open')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching open assignments:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch open assignments within a given radius (in miles) of the user's location.
 * @param {number} userLongitude
 * @param {number} userLatitude
 * @param {number} radiusMiles
 */

export async function getNearbyAssignments({ userLongitude, userLatitude, radiusMiles }) {
  // convert miles → meters
  const radius_m = radiusMiles * 1609.34;

  const { data, error } = await supabase
    .rpc('get_nearby_assignments', {
      user_lon:  userLongitude,
      user_lat:  userLatitude,
      radius_meters: radius_m,
    });

  if (error) {
    console.error('RPC get_nearby_assignments error:', error);
    throw error;
  }
  return data; // array of { assignment_id, start_time, ..., distance_meters }
}
