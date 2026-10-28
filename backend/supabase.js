const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.warn("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.");
}

const supabase = (url && key)
  ? createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

module.exports = { supabase };
