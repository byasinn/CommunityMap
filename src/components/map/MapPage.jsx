import { useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Sidebar from '../Sidebar';
import { useMarkers } from './useMarkers';
import MarkersList from './MarkersList';
import AddMarker from './AddMarker';
import EditModal from './EditModal';

export default function MapPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    vermelho: true,
    amarelo: true,
    roxo: true,
    duvida: true,
    verde: true
  });
  const [editingMarker, setEditingMarker] = useState(null);

  const { markers, loading, error, addMarker, updateMarker, deleteMarker } = useMarkers();

  const filteredMarkers = useMemo(() => {
    return markers.filter(m => filters[m.category]);
  }, [markers, filters]);

  const handleEditSave = (updatedMarker) => {
    updateMarker(updatedMarker.id, {
      title: updatedMarker.title,
      desc: updatedMarker.desc,
      category: updatedMarker.category,
      photoURL: updatedMarker.photoURL
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir marcador?')) {
      await deleteMarker(id);
    }
  };

  if (loading) return <div className="loading">Carregando mapa...</div>;
  if (error) return <div className="error">Erro: {error.message} <button onClick={() => window.location.reload()}>Recarregar</button></div>;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="sidebar-toggle"
        aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {sidebarCollapsed ? '▶' : '◀'}
      </button>

      <Sidebar
        filters={filters}
        setFilters={setFilters}
        markers={markers}
        collapsed={sidebarCollapsed}
      />

      <MapContainer center={[-23.5505, -46.6333]} zoom={13} style={{ height: '90vh', width: '100%' }}>
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap'
        />
        <MarkersList
          markers={filteredMarkers}
          onEdit={setEditingMarker}
          onDelete={handleDelete}
        />
        <AddMarker addMarker={addMarker} />
      </MapContainer>

      {editingMarker && (
        <EditModal
          editingMarker={editingMarker}
          onClose={() => setEditingMarker(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}