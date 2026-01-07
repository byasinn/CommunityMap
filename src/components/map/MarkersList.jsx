import { useEffect } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Marker, Popup } from 'react-leaflet';
import MarkerPopup from './MarkerPopup';

export default function MarkersList({ markers, onEdit, onDelete }) {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
  }, []);

  const createSvgIcon = (svgContent, color) => L.divIcon({
  html: `<div style="color: ${color}; width: 50px; height: 50px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
           ${svgContent}
         </div>`,
  className: 'custom-marker',
  iconSize: [50, 50],
  iconAnchor: [25, 50]
});

const svgContents = {
  vermelho: `<svg xmlns="http://www.w3.org/2000/svg"  width="16" height="16" fill="currentColor" class="bi bi-lightbulb" viewBox="0 0 16 16">
               <path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0zM7 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0"/>
             </svg>`,
  amarelo: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
               <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
             </svg>`,
  roxo: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-lightbulb" viewBox="0 0 16 16">
               <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1"/>
             </svg>`,
  duvida: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question" viewBox="0 0 16 16">
               <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
             </svg>`,
  verde: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
               <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
             </svg>`,

  };

  const categoryIcons = {
    vermelho: createSvgIcon(svgContents.vermelho, '#dc2626'),
    amarelo: createSvgIcon(svgContents.amarelo, '#eab308'),
    roxo: createSvgIcon(svgContents.roxo, '#9333ea'),
    duvida: createSvgIcon(svgContents.duvida, '#6b7280'),
    verde: createSvgIcon(svgContents.verde, '#16a34a')
  };

  return (
    <MarkerClusterGroup>
      {markers.map(marker => (
        marker.position && (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={categoryIcons[marker.category] || categoryIcons.vermelho}
          >
            <Popup>
              <MarkerPopup marker={marker} onEdit={onEdit} onDelete={onDelete} />
            </Popup>
          </Marker>
        )
      ))}
    </MarkerClusterGroup>
  );
}