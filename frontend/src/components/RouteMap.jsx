import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';

const MYSURU = [12.3052, 76.6552];

/** Leaflet map (OpenStreetMap tiles). Shows the selected route's stops, or all stops when none is selected. */
export default function RouteMap({ route, allStops = [], center = MYSURU }) {
  const stops = route ? route.stops : allStops;
  const fallbackLine = route ? (route.stops || []).filter((s) => s.latitude != null && s.longitude != null).map((s) => [s.latitude, s.longitude]) : [];
  const lines = route?.geometry?.length ? route.geometry : (fallbackLine.length > 1 ? [fallbackLine] : []);
  return (
    <MapContainer center={center} zoom={12} className="map" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {lines.map((line, i) => <Polyline key={`line-${i}`} positions={line} pathOptions={{ color: '#0b5cad', weight: 4 }} />)}
      {stops.filter((s) => s.latitude != null && s.longitude != null).map((s, i) => (
        <CircleMarker key={s.id} center={[s.latitude, s.longitude]} radius={7}
                      pathOptions={{ color: '#0b5cad', fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>{route ? `${i + 1}. ` : ''}{s.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
