const BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

function cleanString(value, field, { min = 1, max = 120, optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === "")) return null;
  if (typeof value !== "string") throw new Error(`${field} must be text.`);
  const cleaned = value.trim();
  if (cleaned.length < min || cleaned.length > max) {
    throw new Error(`${field} must be between ${min} and ${max} characters.`);
  }
  return cleaned;
}
function bloodGroup(value) {
  if (typeof value !== "string" || !BLOOD_GROUPS.has(value)) {
    throw new Error("Choose a valid blood group.");
  }
  return value;
}
function phone(value) {
  const result = cleanString(value, "Phone number", { min: 7, max: 20 });
  if (!/^[+()\-\s\d.]+$/.test(result) || result.replace(/\D/g, "").length < 7) {
    throw new Error("Enter a valid phone number.");
  }
  return result;
}
function email(value) {
  if (value === undefined || value === null || value === "") return null;
  const result = cleanString(value, "Email", { max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error("Enter a valid email address.");
  return result.toLowerCase();
}
function dateInFuture(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Needed-by date and time is required.");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid needed-by date and time.");
  if (parsed.getTime() <= Date.now()) throw new Error("Needed-by date and time must be in the future.");
  return parsed.toISOString();
}
function integer(value, field, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${field} must be a whole number between ${min} and ${max}.`);
  return parsed;
}
function validateDonor(body) {
  if (!body || body.consent !== true) throw new Error("Consent to public directory listing is required.");
  if (typeof body.available !== "boolean") throw new Error("Availability selection is required.");
  return {
    full_name: cleanString(body.fullName, "Full name", { min: 2, max: 80 }),
    blood_group: bloodGroup(body.bloodGroup),
    city: cleanString(body.city, "City", { max: 80 }),
    area: cleanString(body.area, "Area", { max: 100, optional: true }),
    phone: phone(body.phone),
    email: email(body.email),
    available: body.available,
    consent_to_listing: true
  };
}
function validateRequest(body) {
  return {
    requester_name: cleanString(body?.requesterName, "Requester name", { min: 2, max: 80 }),
    blood_group: bloodGroup(body?.bloodGroup),
    units_needed: integer(body?.unitsNeeded, "Units needed", 1, 20),
    city: cleanString(body?.city, "City", { max: 80 }),
    hospital: cleanString(body?.hospital, "Hospital / location", { max: 3, max: 140 }),
    phone: phone(body?.phone),
    needed_by: dateInFuture(body?.neededBy),
    details: cleanString(body?.details, "Additional details", { max: 500, optional: true })
  };
}
module.exports = { validateDonor, validateRequest };
