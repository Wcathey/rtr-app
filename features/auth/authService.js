import { supabase } from '../../services/supabase';

/**
 * Registers a new preserver user in Supabase and inserts additional details.
 */
export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
}) {
  if (!email || !password || !firstName || !lastName || !phoneNumber) {
    throw new Error("All fields are required.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format.");
  }

  // Create auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw new Error(signUpError.message);

  const user = signUpData.user;
  if (!user || !user.id) {
    throw new Error("User creation failed or missing user ID.");
  }

  // Insert into users table
  const { error: insertError } = await supabase.from("users").insert([{
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    email: user.email,
    user_type: 'preserver',
  }]);

  if (insertError) throw new Error(insertError.message);

  // Auto-login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(signInError.message);

  return {
    message: "Preserver created and logged in successfully",
    user,
    session: signInData.session,
  };
}

/**
 * Logs in a user using email and password.
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message || "Login failed. Please try again.");
  }

  return {
    message: "Logged in successfully",
    session: data.session,
    user: data.user,
  };
}
