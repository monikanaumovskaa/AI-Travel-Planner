"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Activity } from "@/types/trip";

// Leaflet's default marker icons don't load correctly with bundlers like Next.js —
// this manually points them at the CDN-hosted icon images.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TripMap({ activities }: { activities: Activity[] }) {
  const located = activities.filter(
    (a): a is Activity & { latitude: number; longitude: number } =>
      a.latitude !== null && a.longitude !== null
  );

  if (located.length === 0) {
    return <p>No location data available for the map yet.</p>;
  }

  const center: [number, number] = [located[0].latitude, located[0].longitude];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((activity) => (
        <Marker key={activity.id} position={[activity.latitude, activity.longitude]} icon={markerIcon}>
          <Popup>
            <strong>{activity.name}</strong>
            {activity.start_time && <div>{activity.start_time}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}