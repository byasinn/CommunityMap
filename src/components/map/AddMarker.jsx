import { useState, useEffect } from 'react';
import { useMapEvents, useMap } from 'react-leaflet';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

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
        let width = img.width;
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

export default function AddMarker({ addMarker }) {
  const [adding, setAdding] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('vermelho');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const map = useMap();

  useEffect(() => {
    if (adding) {
      map.getContainer().style.pointerEvents = 'none';
    } else {
      map.getContainer().style.pointerEvents = '';
    }

    return () => {
      map.getContainer().style.pointerEvents = '';
    };
  }, [adding, map]);

  useMapEvents({
    click(e) {
      if (!adding) { // ignora se modal já aberto
        setAdding(e.latlng);
        setTitle('');
        setDesc('');
        setCategory('vermelho');
        setFile(null);
      }
    },
  });

  const handleAdd = async () => {
    if (!title.trim() || !desc.trim()) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    setUploading(true);
    try {
      let photoURL = '';
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
        const storageRef = ref(storage, `markers/temp_${Date.now()}`);
        await uploadBytes(storageRef, compressed);
        photoURL = await getDownloadURL(storageRef);
      }

      await addMarker({
        position: [adding.lat, adding.lng],
        title,
        desc,
        category,
        photoURL
      });

      setAdding(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar');
    } finally {
      setUploading(false);
    }
  };

  if (!adding) return null;

  return (
    <div className="edit-modal-overlay" style={{ pointerEvents: 'auto' }} onClick={() => setAdding(null)}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Novo Marcador</h4>
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
          <button onClick={handleAdd} disabled={uploading}>
            {uploading ? 'Adicionando...' : 'Adicionar'}
          </button>
          <button onClick={() => setAdding(null)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}