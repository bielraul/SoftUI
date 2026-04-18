import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { state, updateState } from '../state';
import { showToast, setSaveStatus } from './ui-utils';

export async function loadUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    updateState({ userProfile: snap.data() });
  } else {
    // Create new profile if it doesn't exist
    const newProfile = {
      displayName: user.displayName || 'Usuário SoftUI',
      email: user.email,
      photoURL: user.photoURL || 'https://picsum.photos/seed/softui/200',
      username: `@${user.email.split('@')[0]}`,
      bio: '',
      createdAt: new Date().toISOString(),
      providerId: user.providerData[0]?.providerId || 'google.com',
      preferences: {
        theme: 'light',
        highContrast: false,
        fontSize: 16
      }
    };
    await setDoc(userRef, newProfile);
    updateState({ userProfile: newProfile });
  }
}

export async function uploadAvatar(file) {
  if (!state.user || !file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Apenas imagens são permitidas!', 'error');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('Tamanho máximo: 2MB!', 'error');
    return;
  }

  const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'png';
  const fileName = `users/${state.user.uid}/profile/avatar.${fileExt}`;
  const storageRef = ref(storage, fileName);

  setSaveStatus('Enviando foto...', 'info');

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const updatedProfile = { ...state.userProfile, photoURL: downloadURL };
    await setDoc(doc(db, 'users', state.user.uid), updatedProfile);
    
    updateState({ userProfile: updatedProfile });
    setSaveStatus('Foto salva!', 'success');
    showToast('Foto atualizada!', 'success');
    return downloadURL;
  } catch (error) {
    console.error("Upload error:", error);
    setSaveStatus('Erro no upload', 'error');
    showToast('Erro ao enviar foto.', 'error');
    throw error;
  }
}

export async function saveProfile(data) {
  if (!state.user) return;
  
  setSaveStatus('Salvando...', 'info');
  
  try {
    const updatedProfile = {
      ...state.userProfile,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', state.user.uid), updatedProfile);
    updateState({ userProfile: updatedProfile });
    
    setSaveStatus('Alterações salvas', 'success');
    showToast('Perfil atualizado!', 'success');
  } catch (error) {
    console.error(error);
    setSaveStatus('Erro ao salvar', 'error');
    showToast('Erro ao salvar perfil.', 'error');
    throw error;
  }
}
