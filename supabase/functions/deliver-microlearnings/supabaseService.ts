import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import { FilterCondition } from './types.ts';


// Deno-compatible environment access
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not set");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Generic operations

export const selectFrom = async <T>(
  table: string,
  columns: string = "*",
  filters?: FilterCondition[]
): Promise<{ data: T[] | null; error: any }> => {
  try {
    let query = supabase.from(table).select(columns);
    filters?.forEach((f) => {
      query = query.filter(f.column, f.operator, f.value);
    });
    const { data, error } = await query;
    return { data, error };
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
    if (returnData) query = query.select();
    const { data: result, error } = await query;
    return { data: result as T, error };
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
    filters.forEach((f) => {
      query = query.filter(f.column, f.operator, f.value);
    });
    if (returnData) query = query.select();
    const { data: result, error } = await query;
    return { data: result as T, error };
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
    filters.forEach((f) => {
      query = query.filter(f.column, f.operator, f.value);
    });
    if (returnData) query = query.select();
    const { data: result, error } = await query;
    return { data: result as T, error };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { data: null, error };
  }
};

// Course-specific operations

export const getCourseDetails = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from("courses")
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
      .eq("id", courseId)
      .single();
    return { data, error };
  } catch (error) {
    console.error("Error fetching course:", error);
    return { data: null, error };
  }
};

export const getLearnerProfile = async (userId: string, courseId: string) => {
  try {
    const { data, error } = await supabase
      .from("learner_profiles")
      .select(`
        *,
        delivery_logs (
          delivery_method,
          success,
          delivered_at
        )
      `)
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();
    return { data, error };
  } catch (error) {
    console.error("Error fetching learner profile:", error);
    return { data: null, error };
  }
};
