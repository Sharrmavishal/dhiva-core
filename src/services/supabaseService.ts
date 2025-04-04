import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not properly configured');
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Generic database operations
/**
 * Generic select operation
 * @param table The table to select from
 * @param columns The columns to select (default: *)
 * @param filters Optional filter conditions
 * @returns The selected data or error
 */
export const select = async (
  table: string, 
  columns: string = '*', 
  filters?: { column: string; operator: string; value: any }[]
) => {
  try {
    let query = supabase.from(table).select(columns);
    
    // Apply filters if provided
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Generic insert operation
 * @param table The table to insert into
 * @param data The data to insert
 * @param returnData Whether to return the inserted data
 * @returns The inserted data or error
 */
export const insert = async (
  table: string, 
  data: any, 
  returnData: boolean = true
) => {
  try {
    let query = supabase.from(table).insert(data);
    
    if (returnData) {
      query = query.select();
    }
    
    const { data: returnedData, error } = await query;
    
    if (error) throw error;
    return { data: returnedData, error: null };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Generic update operation
 * @param table The table to update
 * @param data The data to update
 * @param filters Filter conditions to identify records to update
 * @param returnData Whether to return the updated data
 * @returns The updated data or error
 */
export const update = async (
  table: string, 
  data: any, 
  filters: { column: string; operator: string; value: any }[],
  returnData: boolean = true
) => {
  try {
    let query = supabase.from(table).update(data);
    
    // Apply filters
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    
    if (returnData) {
      query = query.select();
    }
    
    const { data: returnedData, error } = await query;
    
    if (error) throw error;
    return { data: returnedData, error: null };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error };
  }
};

/**
 * Generic delete operation
 * @param table The table to delete from
 * @param filters Filter conditions to identify records to delete
 * @param returnData Whether to return the deleted data
 * @returns The deleted data or error
 */
export const remove = async (
  table: string, 
  filters: { column: string; operator: string; value: any }[],
  returnData: boolean = true
) => {
  try {
    let query = supabase.from(table).delete();
    
    // Apply filters
    filters.forEach(filter => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    
    if (returnData) {
      query = query.select();
    }
    
    const { data: returnedData, error } = await query;
    
    if (error) throw error;
    return { data: returnedData, error: null };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { data: null, error };
  }
};

// Learning Plan Operations
/**
 * Generate a learning plan
 * @param courseId The course ID
 * @param audienceLevel The audience level
 * @returns The generated learning plan
 */
export const generateLearningPlan = async (courseId: string, audienceLevel: string) => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-learning-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ courseId, audienceLevel }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate learning plan');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error generating learning plan:', error);
    return { data: null, error };
  }
};

/**
 * Get microlearnings for a course
 * @param courseId The course ID
 * @returns The microlearnings
 */
export const getMicrolearnings = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('microlearnings')
      .select(`
        *,
        courses (
          title,
          audience_level
        )
      `)
      .eq('course_id', courseId)
      .order('day_number', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching microlearnings:', error);
    return { data: null, error };
  }
};

/**
 * Get course details
 * @param courseId The course ID
 * @returns The course details
 */
export const getCourse = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        pdf_uploads (
          file_url,
          filename
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

/**
 * Save feedback for a microlearning
 * @param feedback The feedback data
 * @returns The saved feedback
 */
export const saveFeedback = async (feedback: {
  microlearning_id: string;
  type: 'thumbs_up' | 'thumbs_down' | 'flag';
  reason?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_flags')
      .insert({
        ...feedback,
        user_id: user.id,
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving feedback:', error);
    return { data: null, error };
  }
};

/**
 * Get user profile and preferences
 * @param userId The user ID
 * @returns The user profile
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('preferences')
      .select(`
        *,
        learner_profiles (
          prior_exposure,
          preferred_format,
          self_assessed_level,
          track_version
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

// Authentication Operations
/**
 * Sign in with email and password
 * @param email The user's email
 * @param password The user's password
 * @returns The user session or error
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 * @returns Success or error
 */
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

/**
 * Get the current session
 * @returns The current session or null
 */
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

export default {
  supabase,
  select,
  insert,
  update,
  remove,
  generateLearningPlan,
  getMicrolearnings,
  getCourse,
  saveFeedback,
  getUserProfile,
  signIn,
  signOut,
  getCurrentSession,
};