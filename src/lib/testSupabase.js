import { supabase } from "./supabase";

export async function testSupabase() {
  const { data, error } = await supabase
    .from("events")
    .select("*");

  if (error) {
    console.error("Supabase error:", error);
    return;
  }

  console.log("Supabase connected successfully:", data);
}