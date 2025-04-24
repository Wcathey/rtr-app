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
      location_id,
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

/**
 * Claim an assignment for the current preserver.
 * @param {number} assignmentId
 * @returns {Promise<Object>} The updated assignment record
 */
export async function acceptAssignment(assignmentId) {
  // For supabase-js v2:
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError) {
    console.error('Auth error fetching user:', authError);
    throw authError;
  }
  if (!user) {
    throw new Error('You must be logged in to accept an assignment');
  }

  const { data, error } = await supabase
    .from('assignments')
    .update({
      status: 'Assigned',
      preserver_id: user.id
    })
    .eq('id', assignmentId)
    .select()   // return the updated row
    .single();

  if (error) {
    console.error('Error accepting assignment:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch the single assignment currently “Assigned” to the logged-in user.
 * @returns {Promise<Object|null>}
 */
export async function getAssignedAssignment() {
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr || new Error('Not authenticated');

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      description,
      base_price,
      tips,
      start_time,
      end_time,
      location:locations (
        address,
        optional_address_ext,
        city,
        state,
        zipcode,
        latitude,
        longitude
      )
    `)
    .eq('preserver_id', user.id)
    .eq('status', 'Assigned')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }
  return data;
}

/**
 * Mark a preserver’s assignment as “Started”
 * @param {number} assignmentId
 */
export async function startAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status: 'Started' })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
