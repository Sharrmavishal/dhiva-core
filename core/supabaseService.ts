import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FilterCondition } from './types';

// Safely get environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not properly configured');
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Generic database operations

export const selectFrom = async <T>(
  table: string,
  columns: string = '*',
  filters?: FilterCondition[]
): Promise<{ data: T[] | null; error: any }> => {
  try {
    let query = supabase.from(table).select(columns);
    filters?.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
};

export const insertInto = async <T>(
  table: string,
  data: any,
  returnData: boolean = true
): Promise<{ data: T | null; error: any }> => {
  try {
    let query = supabase.from(table).insert(data);
    if (returnData) {
      query = query.select();
    }
    const { data: returnedData, error } = await query;
    if (error) throw error;
    return { data: returnedData as T, error: null };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
};

export const updateTable = async <T>(
  table: string,
  data: any,
  filters: FilterCondition[],
  returnData: boolean = true
): Promise<{ data: T | null; error: any }> => {
  try {
    let query = supabase.from(table).update(data);
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    if (returnData) {
      query = query.select();
    }
    const { data: returnedData, error } = await query;
    if (error) throw error;
    return { data: returnedData as T, error: null };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error };
  }
};

export const deleteFrom = async <T>(
  table: string,
  filters: FilterCondition[],
  returnData: boolean = true
): Promise<{ data: T | null; error: any }> => {
  try {
    let query = supabase.from(table).delete();
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    if (returnData) {
      query = query.select();
    }
    const { data: returnedData, error } = await query;
    if (error) throw error;
    return { data: returnedData as T, error: null };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { data: null, error };
  }
};

// Auth operations

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }
};

// Course-specific operations

export const getCourseDetails = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        pdf_uploads (
          file_url,
          filename
        ),
        microlearnings (
          id,
          type,
          content,
          day_number,
          status,
          scheduled_for
        )
      `)
      .eq('id', courseId)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { data: null, error };
  }
};

export const getLearnerProfile = async (userId: string, courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('learner_profiles')
      .select(`
        *,
        delivery_logs (
          delivery_method,
          success,
          delivered_at
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching learner profile:', error);
    return { data: null, error };
  }
};

export default {
  supabase,
  selectFrom,
  insertInto,
  updateTable,
  deleteFrom,
  signIn,
  signOut,
  getCurrentSession,
  getCourseDetails,
  getLearnerProfile,
};
