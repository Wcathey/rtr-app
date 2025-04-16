import { supabase } from '../../services/supabase';

/**
 * Fetches user details for the given user ID from the "users" table.
 *
 * @param {string} userId - The Supabase user ID.
 * @returns {Promise<Object>} - An object containing user details (e.g., first_name, last_name, etc.).
 *
 * @throws Will throw an error if the data cannot be retrieved.
 */
export async function fetchUserDetails(userId) {
  const { data, error } = await supabase
    .from('preservers')
    .select('*')
    .eq('id', userId)
    .maybeSingle(); // Avoids crash when no row is found

  if (error) {
    console.error('❌ Error fetching preserver details:', error.message);
    return null;
  }

  if (!data) {
    console.warn('⚠️ No preserver profile found for this user.');
    return null;
  }

  return data;
}
