import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { state, updateState } from '../state';
import { showToast } from './ui-utils';

export async function saveCloudDesign(name, targetElement, config) {
  if (!state.user) return;

  const designsLoadingState = document.getElementById('designsLoadingState');
  if (designsLoadingState) designsLoadingState.style.display = 'block';

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(targetElement, {
      backgroundColor: config.color,
      scale: 1,
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const designId = Date.now().toString();
    const storageRef = ref(storage, `users/${state.user.uid}/designs/${designId}.png`);
    
    showToast('Enviando preview...', 'info');
    const snapshot = await uploadBytes(storageRef, blob);
    const previewURL = await getDownloadURL(snapshot.ref);

    const generatorConfig = {
      color: config.color,
      size: config.size,
      radius: config.radius,
      distance: config.distance,
      blur: config.blur,
      intensity: config.intensity,
      shape: config.shape,
      direction: config.direction
    };

    const designData = {
      name,
      previewURL,
      config: generatorConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Subcollection strategy: users/{uid}/designs/{designId}
    const designRef = doc(db, 'users', state.user.uid, 'designs', designId);
    await setDoc(designRef, designData);
    
    showToast('Design salvo na nuvem!', 'success');
  } catch (error) {
    console.error("Cloud Save Error:", error);
    showToast('Erro ao salvar na nuvem.', 'error');
    throw error;
  } finally {
    if (designsLoadingState) designsLoadingState.style.display = 'none';
  }
}

export function subscribeToDesigns(uid, callback) {
  const designsRef = collection(db, 'users', uid, 'designs');
  const q = query(designsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snap) => {
    const designs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateState({ cloudDesigns: designs });
    callback(designs);
  }, (error) => {
    console.error("Designs subscription error:", error);
    showToast('Erro ao carregar designs.', 'error');
  });
}

export async function deleteDesign(designId) {
  if (!state.user) return;
  
  try {
    const designRef = doc(db, 'users', state.user.uid, 'designs', designId);
    await deleteDoc(designRef);
    showToast('Design removido.');
  } catch (error) {
    console.error(error);
    showToast('Erro ao remover design.', 'error');
  }
}
