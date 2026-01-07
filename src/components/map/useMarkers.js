import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebase';

export function useMarkers() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real-time markers
  useEffect(() => {
    const q = collection(db, 'markers');
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMarkers(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Add new marker (+10 points)
  const addMarker = async ({ position, title, desc, category, photoURL }) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    const markerRef = await addDoc(collection(db, 'markers'), {
      userId: user.uid,
      position,
      title: title.trim(),
      desc: desc.trim(),
      category,
      photoURL: photoURL || '',
      timestamp: serverTimestamp()
    });

    // Award points
    await updateDoc(doc(db, 'users', user.uid), {
      points: increment(10)
    });

    return { id: markerRef.id, ...arguments[0] };
  };

  // Update marker
  const updateMarker = async (id, updates) => {
    await updateDoc(doc(db, 'markers', id), updates);
  };

  // Delete marker (owner only)
  const deleteMarker = async (id) => {
    await deleteDoc(doc(db, 'markers', id));
  };

  return {
    markers,
    loading,
    error,
    addMarker,
    updateMarker,
    deleteMarker
  };
}