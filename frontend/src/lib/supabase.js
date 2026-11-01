import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (veja .env.example).");
}

export const supabase = createClient(url, key);

export const googleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH === "true";

export const CONTACT_EMAIL = "lucianopereiradejesus14@gmail.com";
export const GITHUB_URL = "https://github.com/lucianopereiradev/RemindMail";
