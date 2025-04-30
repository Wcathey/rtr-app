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
      user_lon: userLongitude,
      user_lat: userLatitude,
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
  const {
    data: { user },
    error: authError,
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
      preserver_id: user.id,
    })
    .eq('id', assignmentId)
    .select() // return the updated row
    .single();

  if (error) {
    console.error('Error accepting assignment:', error);
    throw error;
  }

  return data;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers & new functions for client‐aware fetches
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Internal helper: fetch a user's first/last name and phone by their ID
 */
async function fetchClient(clientId) {
  const { data: client, error } = await supabase
    .from('users')
    .select('first_name, last_name, phone_number')
    .eq('id', clientId)
    .single();
  if (error) {
    console.error(`Error fetching client ${clientId}:`, error);
    throw error;
  }
  return client;
}

/**
 * Fetch the single assignment currently “Assigned” or “Started” to the logged-in user,
 * including its location and the client's basic info.
 */
export async function getAssignedAssignment() {
  // 1️⃣ grab the logged-in user
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user?.id) throw authErr || new Error('Not signed in');

  // 2️⃣ fetch the assignment row (without client join)
  const { data: asn, error: asnErr } = await supabase
    .from('assignments')
    .select(`
      id,
      description,
      base_price,
      tips,
      start_time,
      end_time,
      status,
      client_id,
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
    .eq('preserver_id', user.id)
    .in('status', ['Assigned', 'Started'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (asnErr) {
    console.error('Error fetching assigned assignment:', asnErr);
    throw asnErr;
  }

  // 3️⃣ fetch the client's details and attach
  asn.client = await fetchClient(asn.client_id);
  return asn;
}

/**
 * Fetch a single assignment by its ID—including location and client info.
 * Useful for a detail screen.
 */
export async function getAssignmentById(assignmentId) {
  // 1️⃣ get the assignment
  const { data: asn, error: asnErr } = await supabase
    .from('assignments')
    .select(`
      id,
      description,
      base_price,
      tips,
      start_time,
      end_time,
      client_id,
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
    .eq('id', assignmentId)
    .single();

  if (asnErr) {
    console.error(`Error fetching assignment ${assignmentId}:`, asnErr);
    throw asnErr;
  }

  // 2️⃣ fetch and attach the client
  asn.client = await fetchClient(asn.client_id);
  return asn;
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

  if (error) {
    console.error(`Error starting assignment ${assignmentId}:`, error);
    throw error;
  }
  return data;
}

export async function submitAssignmentForReview(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status: 'Submitted' })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error(`Error starting assignment ${assignmentId}:`, error);
    throw error;
  }
  return data;
}
