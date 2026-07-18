import { supabase } from "./supabaseClient";
import type { Profile } from "../types";

const SESSION_KEY = "hoops_academics_profile";

export async function signUp(username: string, pin: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .rpc("signup_profile", { p_username: username, p_pin: pin, p_display_name: displayName })
    .single();

  if (error) throw new Error(error.message);
  const profile = data as Profile;
  saveSession(profile);
  return profile;
}

export async function logIn(username: string, pin: string): Promise<Profile> {
  const { data, error } = await supabase
    .rpc("login_profile", { p_username: username, p_pin: pin })
    .single();

  if (error) throw new Error("Invalid username or PIN");
  const profile = data as Profile;
  saveSession(profile);
  return profile;
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): Profile | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function saveSession(profile: Profile) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
}
