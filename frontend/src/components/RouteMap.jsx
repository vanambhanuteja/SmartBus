import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';

const MYSURU = [12.3052, 76.6552];

/** Leaflet map (OpenStreetMap tiles). Shows the selected route's stops, or all stops when none is selected. */
export default function RouteMap({ route, allStops = [] }) {
  const stops = route ? route.stops : allStops;
  const line = route ? route.stops.map((s) => [s.latitude, s.longitude]) : [];
  return (
    <MapContainer center={MYSURU} zoom={12} className="map" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#0b5cad', weight: 4 }} />}
      {stops.map((s, i) => (
        <CircleMarker key={s.id} center={[s.latitude, s.longitude]} radius={7}
                      pathOptions={{ color: '#0b5cad', fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>{route ? `${i + 1}. ` : ''}{s.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
