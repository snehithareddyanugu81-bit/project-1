const API = "/api";
const $ = (selector) => document.querySelector(selector);
const toast = $("#toast");
let toastTimer;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 3600);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
  return payload;
}
function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleString();
}
async function loadDonors(filters = {}) {
  const results = $("#donor-results");
  results.innerHTML = '<div class="loading-card">Searching the donor directory…</div>';
  const params = new URLSearchParams();
  if (filters.bloodGroup) params.set("bloodGroup", filters.bloodGroup);
  if (filters.city) params.set("city", filters.city);
  try {
    const data = await api(`/donors${params.size ? `?${params}` : ""}`);
    $("#donor-count").textContent = data.total;
    if (!data.donors.length) {
      results.innerHTML = '<div class="empty-state">No donors match these filters yet. Try another blood group or city.</div>';
      return;
    }
    results.innerHTML = data.donors.map(donor => `
      <article class="donor-card">
        <div class="donor-top"><div class="avatar">${escapeHtml(initials(donor.full_name))}</div><span class="blood-badge">${escapeHtml(donor.blood_group)}</span></div>
        <h3>${escapeHtml(donor.full_name)}</h3>
        <p>⌖ ${escapeHtml(donor.area ? `${donor.area}, ` : "")}${escapeHtml(donor.city)}</p>
        <p>${donor.available ? "Currently willing to be contacted" : "Not currently available"}</p>
        <a class="contact-link" href="tel:${escapeHtml(donor.phone)}">Call ${escapeHtml(donor.phone)}</a>
      </article>`).join("");
  } catch (error) {
    results.innerHTML = '<div class="empty-state">Could not load donors. Check that the server and Supabase configuration are running.</div>';
    showToast(error.message, true);
  }
}
async function loadRequests() {
  const results = $("#request-results");
  results.innerHTML = '<div class="loading-card">Loading recent requests…</div>';
  try {
    const data = await api("/requests");
    $("#request-count").textContent = data.total;
    if (!data.requests.length) {
      results.innerHTML = '<div class="empty-state">There are no open requests right now.</div>';
      return;
    }
    results.innerHTML = data.requests.map(request => `
      <article class="request-card">
        <div class="request-head"><span class="blood-badge">${escapeHtml(request.blood_group)}</span><span class="status">${escapeHtml(request.status)}</span></div>
        <h3>${escapeHtml(request.blood_group)} blood needed — ${escapeHtml(request.city)}</h3>
        <p>${escapeHtml(request.hospital)}</p>
        <p>${escapeHtml(request.details || "Please contact the requester for details.")}</p>
        <div class="request-meta">
          <div><span>Units needed</span><strong>${Number(request.units_needed)}</strong></div>
          <div><span>Needed by</span><strong>${escapeHtml(formatDate(request.needed_by))}</strong></div>
          <div><span>Contact person</span><strong>${escapeHtml(request.requester_name)}</strong></div>
          <div><span>Contact phone</span><strong><a class="contact-link" href="tel:${escapeHtml(request.phone)}">${escapeHtml(request.phone)}</a></strong></div>
        </div>
      </article>`).join("");
  } catch (error) {
    results.innerHTML = '<div class="empty-state">Could not load requests. Check the server and database settings.</div>';
    showToast(error.message, true);
  }
}
function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}
$("#search-form").addEventListener("submit", event => {
  event.preventDefault();
  loadDonors({ bloodGroup: $("#search-blood").value, city: $("#search-city").value.trim() });
});
$("#clear-search").addEventListener("click", () => {
  $("#search-form").reset();
  loadDonors();
});
$("#donor-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = formObject(form);
  data.available = form.elements.available.checked;
  data.consent = form.elements.consent.checked;
  try {
    await api("/donors", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    showToast("Thank you! Your donor registration has been saved.");
    await loadDonors();
  } catch (error) { showToast(error.message, true); }
});
$("#request-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = formObject(form);
  if (new Date(data.neededBy).getTime() < Date.now()) {
    showToast("Choose a future date and time for the request.", true);
    return;
  }
  try {
    await api("/requests", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    showToast("Emergency request submitted and listed for the community.");
    await loadRequests();
    $("#open-requests").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { showToast(error.message, true); }
});
$("#refresh-requests").addEventListener("click", loadRequests);
$("#year").textContent = new Date().getFullYear();
loadDonors();
loadRequests();
