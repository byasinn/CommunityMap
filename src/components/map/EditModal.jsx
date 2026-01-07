import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet'; // novo import
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;dsd
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function EditModal({ editingMarker, onClose, onSave }) {
  const [title, setTitle] = useState(editingMarker.title || '');
  const [desc, setDesc] = useState(editingMarker.desc || '');
  const [category, setCategory] = useState(editingMarker.category || 'vermelho');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const map = useMap();

  // Desabilita interações do mapa enquanto modal aberto
  useEffect(() => {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();

    return () => {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    };
  }, [map]);

  const handleSave = async () => {
    if (!title.trim() || !desc.trim()) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    setUploading(true);
    try {
      let photoURL = editingMarker.photoURL;

      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          alert('Imagem muito grande (máx 5MB)');
          return;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          alert('Formato inválido');
          return;
        }
        const compressed = await compressImage(file);
        const storageRef = ref(storage, `markers/${editingMarker.id}`);
        await uploadBytes(storageRef, compressed);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'markers', editingMarker.id), {
        title: title.trim(),
        desc: desc.trim(),
        category,
        photoURL
      });

      onSave({ ...editingMarker, title, desc, category, photoURL });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Editar Marcador</h4>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título *"
          maxLength={100}
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descrição *"
          maxLength={500}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="vermelho">Vermelho (perigo)</option>
          <option value="amarelo">Amarelo (simples)</option>
          <option value="roxo">Roxo (ideia)</option>
          <option value="duvida">Dúvida (?)</option>
          <option value="verde">Verde (positivo)</option>
        </select>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="modal-buttons">
          <button onClick={handleSave} disabled={uploading}>
            {uploading ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}