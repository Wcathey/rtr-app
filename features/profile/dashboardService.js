// features/profile/dashboardService.js

import { supabase } from '../../services/supabase';

/**
 * Fetches the profile details for a given user ID from the "users" table.
 * @param {string} userId
 * @returns {Promise<Object>} { id, first_name, last_name, email, phone_number, profile_picture, user_type, created_at }
 */
export async function fetchUserDetails(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone_number,
      profile_picture,
      user_type,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error fetching user details:', error);
    throw error;
  }
  return data;
}
