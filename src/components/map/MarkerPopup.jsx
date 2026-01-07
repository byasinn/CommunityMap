import { auth } from '../../firebase';

export default function MarkerPopup({ marker, onEdit, onDelete }) {
  const isOwner = auth.currentUser?.uid === marker.userId;

  return (
    <div className="popup-content">
      <h4>{marker.title}</h4>
      <p>{marker.desc}</p>
      {marker.photoURL && (
        <img 
          src={marker.photoURL} 
          alt="Foto do marcador" 
          style={{ maxWidth: '200px', borderRadius: '8px', margin: '8px 0' }} 
        />
      )}
      {isOwner && (
        <div className="popup-actions">
          <button onClick={() => onEdit(marker)}>Editar</button>
          <button onClick={() => onDelete(marker.id)} className="btn-danger">Excluir</button>
        </div>
      )}
    </div>
  );
}