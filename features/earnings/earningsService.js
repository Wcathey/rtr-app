import { supabase } from '../../services/supabase';

export async function getEarnings() {
  // 1️⃣ Get current preserver
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    throw authErr || new Error('Not signed in');
  }

  // 2️⃣ Fetch completed assignments/payments for this preserver
  //    Adjust column names as needed (e.g. base_price, tips, start_time, end_time)
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      created_at,
      base_price,
      tips,
      start_time,
      end_time
    `)
    .eq('preserver_id', user.id)
    .eq('status', 'Completed')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 3️⃣ Map into a simpler shape
  return data.map(item => ({
    id: item.id,
    date: item.created_at,
    base: item.base_price || 0,
    tips: item.tips || 0,
    total: (item.base_price || 0) + (item.tips || 0),
    start: item.start_time,
    end: item.end_time,
  }));
}
