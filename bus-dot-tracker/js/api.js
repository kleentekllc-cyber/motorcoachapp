// ===================================
// BUS DOT HOURS TRACKER - API CLIENT
// ===================================

const API_BASE = "http://localhost:3000/api";

// --------------------------
// GENERIC API METHODS
// --------------------------

async function apiGet(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API GET Error:', error);
    throw error;
  }
}

async function apiPost(path, body) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API POST Error:', error);
    throw error;
  }
}

async function apiPut(path, body) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API PUT Error:', error);
    throw error;
  }
}

// --------------------------
// DRIVERS API
// --------------------------

const DriversAPI = {
  getAll: () => apiGet("/drivers"),
  getOne: (id) => apiGet(`/drivers/${id}`),
  create: (data) => apiPost("/drivers", data),
  update: (id, data) => apiPut(`/drivers/${id}`, data)
};

// --------------------------
// VEHICLES API
// --------------------------

const VehiclesAPI = {
  getAll: () => apiGet("/vehicles"),
  getOne: (id) => apiGet(`/vehicles/${id}`),
  create: (data) => apiPost("/vehicles", data),
  update: (id, data) => apiPut(`/vehicles/${id}`, data)
};

// --------------------------
// TRIPS API
// --------------------------

const TripsAPI = {
  getAll: () => apiGet("/trips"),
  getOne: (id) => apiGet(`/trips/${id}`),
  create: (data) => apiPost("/trips", data),
  update: (id, data) => apiPut(`/trips/${id}`, data)
};

// --------------------------
// HOS ENGINE API
// --------------------------

const HOSAPI = {
  calculate: (driverId, tripId) => apiPost("/hos/calculate", {
    driver_id: driverId,
    trip_id: tripId
  })
};

// --------------------------
// TIMELINE ENGINE API
// --------------------------

const TimelineAPI = {
  generate: (tripId) => apiPost("/timeline/generate", {
    trip_id: tripId
  })
};

// --------------------------
// PAY ENGINE API
// --------------------------

const PayAPI = {
  calculate: (driverId, tripId, revenue, tripType) => apiPost("/pay/calculate", {
    driver_id: driverId,
    trip_id: tripId,
    revenue: revenue,
    trip_type: tripType
  })
};

// --------------------------
// DOT SETTINGS API
// --------------------------

const SettingsAPI = {
  getDOT: () => apiGet("/settings/dot"),
  updateDOT: (data) => apiPut("/settings/dot", data)
};

// --------------------------
// EXPORT
// --------------------------

// Make available globally
window.API = {
  drivers: DriversAPI,
  vehicles: VehiclesAPI,
  trips: TripsAPI,
  hos: HOSAPI,
  timeline: TimelineAPI,
  pay: PayAPI,
  settings: SettingsAPI
};
