import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, provider, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { state, updateState } from '../state';

export function login() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth).then(() => {
    window.location.reload();
  });
}

export async function checkAdminStatus(uid) {
  const adminRef = doc(db, 'admins', uid);
  const adminSnap = await getDoc(adminRef);
  const adminTab = document.getElementById('adminTab');
  
  if (adminSnap.exists()) {
    updateState({ isAdmin: true });
    if (adminTab) adminTab.style.display = 'block';
  } else {
    updateState({ isAdmin: false });
    if (adminTab) adminTab.style.display = 'none';
    if (window.location.hash === '#/admin') {
       window.navigateTo('generator');
    }
  }
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
