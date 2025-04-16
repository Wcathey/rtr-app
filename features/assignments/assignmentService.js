import { supabase } from '../../services/supabase';

export async function getAssignments() {
  try {
    // Get the currently logged in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw userError;
    }
    if (!user) {
      throw new Error('User not logged in');
    }

    // Fetch assignments where client_id matches the logged-in user's id
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Return assignments (empty array if none found)
    return assignments || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}

export async function createAssignment({ client_id, description, location_id, base_price }) {
  try {
    // Validate required fields
    if (!client_id || !description || !location_id || base_price == null) {
      throw new Error('client_id, description, location_id, and base_price are required.');
    }

    // Fetch the user's details from the "users" table using the provided client_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', client_id)
      .single();

    if (userError) {
      throw new Error(userError.message);
    }

    // Ensure only users with user_type 'client' or 'admin' can create an assignment
    if (userData.user_type !== 'client' && userData.user_type !== 'admin') {
      throw new Error('Only users with a client or admin role can create an assignment.');
    }

    // Insert a new assignment into the "assignments" table
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        {
          client_id,          // The current user id
          preserver_id: null,  // Initially set to null until a preserver picks up the assignment
          description,        // Required description
          location_id,        // References the locations table
          base_price,         // The assignment's base price
          status: 'Pending',  // Set the initial status to "pending"
        },
      ])
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    // Return the created assignment
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}
