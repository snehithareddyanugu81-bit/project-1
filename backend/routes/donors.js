const express = require("express");
const { supabase } = require("../supabase");
const { validateDonor } = require("../middleware/validation");
const router = express.Router();

router.get("/", async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const bloodGroup = typeof req.query.bloodGroup === "string" ? req.query.bloodGroup.trim() : "";
    const city = typeof req.query.city === "string" ? req.query.city.trim().slice(0, 80) : "";
    if (bloodGroup && !["A+","A-","B+","B-","AB+","AB-","O+","O-"].includes(bloodGroup)) {
      return res.status(400).json({ error: "Invalid blood group filter." });
    }
    let query = supabase.from("donors")
      .select("id, full_name, blood_group, city, area, phone, available, created_at", { count: "exact" })
      .eq("consent_to_listing", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (bloodGroup) query = query.eq("blood_group", bloodGroup);
    if (city) query = query.ilike("city", `%${city.replace(/[%_,]/g, "")}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ donors: data || [], total: count || 0 });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: "Database is not configured yet." });
  try {
    const donor = validateDonor(req.body);
    const { data, error } = await supabase.from("donors").insert(donor)
      .select("id, full_name, blood_group, city, area, available, created_at").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "A donor with this phone number is already registered." });
      throw error;
    }
    res.status(201).json({ donor: data });
  } catch (error) {
    if (error instanceof Error && !error.code) return res.status(400).json({ error: error.message });
    next(error);
  }
});
module.exports = router;
