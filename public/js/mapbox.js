export const displayMap = () => {
  const mapEl = document.getElementById('map');
  if (!mapEl || !mapEl.dataset.locations) return;

  const locations = JSON.parse(mapEl.dataset.locations);

  // Reset previous map if it exists
  const existingMap = L.DomUtil.get('map');
  if (existingMap) existingMap._leaflet_id = null;

  // Initialize map with zoom control
  const map = L.map('map', { zoomControl: true });

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    crossOrigin: '',
  }).addTo(map);

  // Plot markers
  const points = [];
  locations.forEach((loc) => {
    const latLng = [loc.coordinates[1], loc.coordinates[0]];
    points.push(latLng);
    L.marker(latLng)
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
      })
      .openPopup();
  });

  // Fit map to bounds
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);

  // Enable scroll wheel zoom
  map.scrollWheelZoom.enable();
};
