const express = require("express");
const { supabase } = require("../supabase");
const { validateRequest } = require("../middleware/validation");
const router = express.Router();

router.get("/", async (_req, res, next) => {
  if (!supabase) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const { data, error, count } = await supabase.from("emergency_requests")
      .select("id, requester_name, blood_group, units_needed, city, hospital, phone, needed_by, details, status, created_at", { count: "exact" })
      .eq("status", "open").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json({ requests: data || [], total: count || 0 });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const request = validateRequest(req.body);
    const { data, error } = await supabase.from("emergency_requests").insert(request)
      .select("id, requester_name, blood_group, units_needed, city, hospital, needed_by, status, created_at").single();
    if (error) throw error;
    res.status(201).json({ request: data });
  } catch (error) {
    if (error instanceof Error && !error.code) return res.status(400).json({ error: error.message });
    next(error);
  }
});
module.exports = router;
