/**
 * SoftUI Lab - Logic
 * Pure Vanilla JavaScript + Firebase
 */
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// State Object
const state = {
  color: '#e6e9ef',
  size: 300,
  radius: 50,
  distance: 20,
  blur: 40,
  intensity: 0.15,
  shape: 'flat', // flat, concave, convex, pressed
  direction: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
  isHighContrast: false,
  isCleanMode: false,
  fontSize: 16,
  user: null,
  userProfile: null,
  isAdmin: false,
  adminCriteria: [],
  adminConfigId: 'default-config',
  cloudDesigns: [],
};

// Global saved designs array
let savedDesigns = JSON.parse(localStorage.getItem('softui_saved_designs') || '[]');

// DOM Elements
const targetElement = document.getElementById('targetElement');
const cssCodeDisplay = document.getElementById('cssCode');
const copyBtn = document.getElementById('copyBtn');
const randomBtn = document.getElementById('randomBtn');
const saveDesignBtn = document.getElementById('saveDesignBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPngBtn = document.getElementById('exportPngBtn');
const savedGrid = document.getElementById('savedGrid');
const savedDesignsSection = document.getElementById('savedDesignsSection');

// Auth & Tabs
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const adminTab = document.getElementById('adminTab');
const profileTab = document.getElementById('profileTab');
const tabBtns = document.querySelectorAll('.tab-btn');
const generatorView = document.getElementById('generatorView');
const adminView = document.getElementById('adminView');
const profileView = document.getElementById('profileView');

// User Profile Elements
const avatarContainer = document.getElementById('avatarContainer');
const avatarUpload = document.getElementById('avatarUpload');
const profileAvatar = document.getElementById('profileAvatar');
const profileFullName = document.getElementById('profileFullName');
const profileEmail = document.getElementById('profileEmail');
const profileMemberSince = document.getElementById('profileMemberSince');
const profileProvider = document.getElementById('profileProvider');
const editDisplayName = document.getElementById('editDisplayName');
const editUsername = document.getElementById('editUsername');
const editBio = document.getElementById('editBio');
const prefTheme = document.getElementById('prefTheme');
const prefHighContrast = document.getElementById('prefHighContrast');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const logoutFullBtn = document.getElementById('logoutFullBtn');
const resetPrefsBtn = document.getElementById('resetPrefsBtn');
const feedbackToast = document.getElementById('feedbackToast');
const cloudSavedGrid = document.getElementById('cloudSavedGrid');

// Admin Elements
const criteriaName = document.getElementById('criteriaName');
const criteriaWeight = document.getElementById('criteriaWeight');
const criteriaMax = document.getElementById('criteriaMax');
const addCriteriaBtn = document.getElementById('addCriteriaBtn');
const criteriaList = document.getElementById('criteriaList');
const eventTitle = document.getElementById('eventTitle');
const eventStatus = document.getElementById('eventStatus');
const saveConfigBtn = document.getElementById('saveConfigBtn');

// Accessibility Elements
const toggleAccPanelBtn = document.getElementById('toggleAccPanel');
const closeAccPanelBtn = document.getElementById('closeAccPanel');
const accessibilityPanel = document.getElementById('accessibilityPanel');
const toggleMotionBtn = document.getElementById('toggleMotion');
const resetAccBtn = document.getElementById('resetAccBtn');
const toggleContrastBtn = document.getElementById('toggleContrast');
const fontDownBtn = document.getElementById('fontDown');
const fontUpBtn = document.getElementById('fontUp');
const toggleDistractionBtn = document.getElementById('toggleDistraction');
const toggleGrayscaleBtn = document.getElementById('toggleGrayscale');
const toggleUnderlineBtn = document.getElementById('toggleUnderline');
const toggleCursorBtn = document.getElementById('toggleCursor');
const body = document.body;

// State extension for new accessibility features
state.reduceMotion = false;
state.isGrayscale = false;
state.isUnderline = false;
state.isBigCursor = false;


// Inputs
const colorInput = document.getElementById('colorInput');
const colorText = document.getElementById('colorText');
const sizeInput = document.getElementById('sizeInput');
const radiusInput = document.getElementById('radiusInput');
const distanceInput = document.getElementById('distanceInput');
const blurInput = document.getElementById('blurInput');
const intensityInput = document.getElementById('intensityInput');
const shapeBtns = document.querySelectorAll('.shape-btn');
const dirBtns = document.querySelectorAll('.dir-btn');

/**
 * Helper: Lighten or Darken a Hex color
 * @param {string} hex - Hex color string
 * @param {number} amount - Positive to lighten, negative to darken (-1 to 1)
 */
function colorLuminance(hex, amount) {
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  amount = amount || 0;

  let rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * amount)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }
  return rgb;
}

/**
 * Firebase Auth & Admin Logic
 */
async function login() {
  try {
    const result = await signInWithPopup(auth, provider);
    // User is logged in
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Falha ao entrar com Google.");
  }
}

async function logout() {
  await signOut(auth);
  window.location.reload();
}

async function checkAdminStatus(uid) {
  const adminRef = doc(db, 'admins', uid);
  const adminSnap = await getDoc(adminRef);
  
  if (adminSnap.exists()) {
    state.isAdmin = true;
    adminTab.style.display = 'block';
  } else {
    state.isAdmin = false;
    adminTab.style.display = 'none';
    // Back to generator if user was in admin view
    switchTab('generator');
  }
}

function switchTab(tabId) {
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  
  generatorView.classList.toggle('active', tabId === 'generator');
  adminView.classList.toggle('active', tabId === 'admin');
  profileView.classList.toggle('active', tabId === 'profile');
}

/**
 * Feedback Toast
 */
function showToast(message, type = 'success') {
  feedbackToast.textContent = message;
  feedbackToast.className = `feedback-toast active ${type}`;
  setTimeout(() => {
    feedbackToast.classList.remove('active');
  }, 3000);
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    state.user = user;
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userAvatar.src = user.photoURL;
    userName.textContent = user.displayName;
    profileTab.style.display = 'block';
    
    // Provision/Load Profile
    await loadUserProfile(user);
    
    // Check if admin
    await checkAdminStatus(user.uid);
    
    // Listen to configs if admin
    if (state.isAdmin) {
      loadJudgingConfig();
    }

    // Load Cloud Designs
    loadCloudDesigns();
  } else {
    state.user = null;
    state.isAdmin = false;
    state.userProfile = null;
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    adminTab.style.display = 'none';
    profileTab.style.display = 'none';
    switchTab('generator');
  }
});

/**
 * User Profile Logic
 */
async function uploadAvatar(file) {
  if (!state.user || !file) return;

  const fileExt = file.name.split('.').pop();
  const fileName = `avatars/${state.user.uid}.${fileExt}`;
  const storageRef = ref(storage, fileName);

  avatarContainer.classList.add('uploading');
  showToast('Enviando nova foto...', 'success');

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update local state
    state.userProfile.photoURL = downloadURL;
    profileAvatar.src = downloadURL;
    userAvatar.src = downloadURL; // Update top header too

    // Save to Firestore immediately
    await setDoc(doc(db, 'users', state.user.uid), {
      ...state.userProfile,
      photoURL: downloadURL
    });

    avatarContainer.classList.remove('uploading');
    showToast('Foto atualizada!', 'success');
  } catch (error) {
    console.error("Upload error:", error);
    avatarContainer.classList.remove('uploading');
    showToast('Erro ao enviar foto.', 'error');
  }
}

async function loadUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    state.userProfile = snap.data();
  } else {
    // Create new profile
    const newProfile = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      username: `@${user.email.split('@')[0]}`,
      bio: '',
      createdAt: new Date().toISOString(),
      providerId: user.providerData[0].providerId,
      preferences: {
        theme: 'light',
        highContrast: false,
        fontSize: 16
      }
    };
    await setDoc(userRef, newProfile);
    state.userProfile = newProfile;
  }
  
  updateProfileUI();
  applyPreferences(state.userProfile.preferences);
}

function updateProfileUI() {
  const p = state.userProfile;
  if (!p) return;

  profileAvatar.src = p.photoURL;
  userAvatar.src = p.photoURL;
  profileFullName.textContent = p.displayName;
  userName.textContent = p.displayName;
  profileEmail.textContent = p.email;
  profileMemberSince.textContent = new Date(p.createdAt).toLocaleDateString();
  profileProvider.textContent = p.providerId;

  editDisplayName.value = p.displayName;
  editUsername.value = p.username || '';
  editBio.value = p.bio || '';
  prefTheme.value = p.preferences.theme || 'light';
  
  state.isHighContrast = p.preferences.highContrast;
  prefHighContrast.classList.toggle('active', state.isHighContrast);
}

function applyPreferences(prefs) {
  if (!prefs) return;
  state.isHighContrast = prefs.highContrast || false;
  state.fontSize = prefs.fontSize || 16;
  state.isCleanMode = prefs.cleanMode || false;
  state.reduceMotion = prefs.reduceMotion || false;
  state.isGrayscale = prefs.isGrayscale || false;
  state.isUnderline = prefs.isUnderline || false;
  state.isBigCursor = prefs.isBigCursor || false;
  updateAccessibility();
}

async function saveUserProfile() {
  if (!state.user) return;
  
  showToast('Salvando...', 'success');
  
  const updatedProfile = {
    ...state.userProfile,
    displayName: editDisplayName.value,
    username: editUsername.value,
    bio: editBio.value,
    preferences: {
      theme: prefTheme.value,
      highContrast: state.isHighContrast,
      fontSize: state.fontSize,
      cleanMode: state.isCleanMode,
      reduceMotion: state.reduceMotion,
      isGrayscale: state.isGrayscale,
      isUnderline: state.isUnderline,
      isBigCursor: state.isBigCursor
    }
  };

  try {
    await setDoc(doc(db, 'users', state.user.uid), updatedProfile);
    state.userProfile = updatedProfile;
    userName.textContent = updatedProfile.displayName;
    showToast('Perfil salvo com sucesso!', 'success');
  } catch (error) {
    console.error(error);
    showToast('Erro ao salvar perfil.', 'error');
  }
}

/**
 * Cloud Designs Logic
 */
async function saveCloudDesign() {
  if (!state.user) return saveDesign(); // Fallback to local if not logged in

  const name = prompt('Nome do design na nuvem:', `Cloud Design ${state.cloudDesigns.length + 1}`);
  if (!name) return;

  showToast('Processando design...', 'success');

  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(targetElement, {
      backgroundColor: state.color,
      scale: 1, // Preview scale
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const designId = Date.now().toString();
    const storageRef = ref(storage, `designs/${state.user.uid}/${designId}.png`);
    
    showToast('Enviando para o Storage...', 'success');
    const snapshot = await uploadBytes(storageRef, blob);
    const previewURL = await getDownloadURL(snapshot.ref);

    const designData = {
      name,
      previewURL,
      config: { ...state, user: null, userProfile: null, cloudDesigns: [] }, // Clean state
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const designRef = doc(db, 'users', state.user.uid, 'designs', designId);
    await setDoc(designRef, designData);
    showToast('Design salvo permanentemente!', 'success');
  } catch (error) {
    console.error("Cloud Save Error:", error);
    showToast('Erro ao salvar na nuvem.', 'error');
  }
}

function loadCloudDesigns() {
  if (!state.user) return;
  
  const designsRef = collection(db, 'users', state.user.uid, 'designs');
  onSnapshot(designsRef, (snap) => {
    state.cloudDesigns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCloudDesigns();
  });
}

function renderCloudDesigns() {
  cloudSavedGrid.innerHTML = '';
  if (state.cloudDesigns.length === 0) {
    cloudSavedGrid.innerHTML = '<p style="opacity: 0.5;">Nenhum design salvo na nuvem ainda.</p>';
    return;
  }

  state.cloudDesigns.forEach(design => {
    const item = document.createElement('div');
    item.className = 'saved-item';
    
    const dark = colorLuminance(design.config.color, -design.config.intensity);
    const light = colorLuminance(design.config.color, design.config.intensity);
    
    const previewHTML = design.previewURL 
      ? `<img src="${design.previewURL}" class="saved-preview" alt="Preview">`
      : `<div class="saved-preview" style="background: ${design.config.color}; box-shadow: 4px 4px 8px ${dark}, -4px -4px 8px ${light}; border-radius: 8px;"></div>`;

    item.innerHTML = `
      ${previewHTML}
      <div class="saved-info">
        <div class="saved-name">${design.name}</div>
        <div class="saved-date">Cloud • ${new Date(design.updatedAt).toLocaleDateString()}</div>
      </div>
      <div class="saved-actions">
        <button class="saved-btn load-btn">Abrir</button>
        <button class="saved-btn delete delete-btn">Excluir</button>
      </div>
    `;

    item.querySelector('.load-btn').onclick = () => {
      Object.assign(state, design.config);
      updateUI();
      switchTab('generator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    item.querySelector('.delete-btn').onclick = async () => {
      if (confirm('Excluir este design da nuvem?')) {
        await deleteDoc(doc(db, 'users', state.user.uid, 'designs', design.id));
        showToast('Design removido.');
      }
    };

    cloudSavedGrid.appendChild(item);
  });
}

/**
 * Judging System Logic (Admin)
 */
function addCriteria() {
  const name = criteriaName.value.trim();
  const weight = parseFloat(criteriaWeight.value);
  const max = parseFloat(criteriaMax.value);

  if (!name) return alert("Digite um nome para o critério.");

  state.adminCriteria.push({
    id: Date.now(),
    name,
    weight,
    maxScore: max
  });

  criteriaName.value = '';
  renderCriteriaList();
}

function removeCriteria(id) {
  state.adminCriteria = state.adminCriteria.filter(c => c.id !== id);
  renderCriteriaList();
}

function renderCriteriaList() {
  criteriaList.innerHTML = '';
  state.adminCriteria.forEach(c => {
    const div = document.createElement('div');
    div.className = 'criteria-item';
    div.innerHTML = `
      <div class="criteria-info">
        <h4>${c.name}</h4>
        <p>Peso: ${c.weight} | Máx: ${c.maxScore}</p>
      </div>
      <button class="saved-btn delete" onclick="this.parentElement.removeCriteria(${c.id})">Remover</button>
    `;
    // Attach event via global to keep it simple in vanilla
    div.querySelector('button').onclick = () => removeCriteria(c.id);
    criteriaList.appendChild(div);
  });
}

async function saveJudgingConfig() {
  if (!state.user || !state.isAdmin) return;

  const data = {
    title: eventTitle.value || "Evento Sem Nome",
    status: eventStatus.value,
    criteria: state.adminCriteria,
    updatedAt: new Date().toISOString(), // Rule will override with request.time
    updatedBy: state.user.uid
  };

  try {
    // We use a fixed ID for demo simplicity, or could generate one
    await setDoc(doc(db, 'configs', state.adminConfigId), {
      ...data,
      updatedAt: new Date() // Firestore Timestamp placeholder
    });
    alert("Configurações salvas com sucesso no Firebase!");
  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    alert("Falha ao salvar. Verifique as regras de segurança.");
  }
}

async function loadJudgingConfig() {
  const configRef = doc(db, 'configs', state.adminConfigId);
  const snap = await getDoc(configRef);
  
  if (snap.exists()) {
    const data = snap.data();
    eventTitle.value = data.title;
    eventStatus.value = data.status;
    state.adminCriteria = data.criteria || [];
    renderCriteriaList();
  }
}

/**
 * Event Listeners Extensions
 */
loginBtn.addEventListener('click', login);
userInfo.addEventListener('click', () => { if(state.user) switchTab('profile'); });
logoutFullBtn.addEventListener('click', logout);
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
addCriteriaBtn.addEventListener('click', addCriteria);
saveConfigBtn.addEventListener('click', saveJudgingConfig);
saveProfileBtn.addEventListener('click', saveUserProfile);

// Accessibility Elements Logic
toggleAccPanelBtn.addEventListener('click', toggleAccPanel);
closeAccPanelBtn.addEventListener('click', () => accessibilityPanel.classList.remove('active'));

// Avatar Upload trigger
avatarContainer.addEventListener('click', () => avatarUpload.click());
avatarUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadAvatar(file);
  }
});

toggleContrastBtn.addEventListener('click', () => {
  state.isHighContrast = !state.isHighContrast;
  updateAccessibility();
});

fontUpBtn.addEventListener('click', () => {
  if (state.fontSize < 24) state.fontSize += 2;
  updateAccessibility();
});

fontDownBtn.addEventListener('click', () => {
  if (state.fontSize > 12) state.fontSize -= 2;
  updateAccessibility();
});

toggleDistractionBtn.addEventListener('click', () => {
  state.isCleanMode = !state.isCleanMode;
  updateAccessibility();
});

toggleMotionBtn.addEventListener('click', () => {
  state.reduceMotion = !state.reduceMotion;
  updateAccessibility();
});

toggleGrayscaleBtn.addEventListener('click', () => {
  state.isGrayscale = !state.isGrayscale;
  updateAccessibility();
});

toggleUnderlineBtn.addEventListener('click', () => {
  state.isUnderline = !state.isUnderline;
  updateAccessibility();
});

toggleCursorBtn.addEventListener('click', () => {
  state.isBigCursor = !state.isBigCursor;
  updateAccessibility();
});

resetAccBtn.addEventListener('click', () => {
  state.fontSize = 16;
  state.isHighContrast = false;
  state.isCleanMode = false;
  state.reduceMotion = false;
  state.isGrayscale = false;
  state.isUnderline = false;
  state.isBigCursor = false;
  updateAccessibility();
  showToast('Preferências de acessibilidade resetadas.');
});

prefHighContrast.addEventListener('click', () => {
  state.isHighContrast = !state.isHighContrast;
  prefHighContrast.classList.toggle('active', state.isHighContrast);
  updateAccessibility();
});

saveDesignBtn.addEventListener('click', async () => {
  if(state.user) {
    await saveCloudDesign();
  } else {
    saveDesign();
  }
});

resetPrefsBtn.addEventListener('click', () => {
  state.fontSize = 16;
  state.isHighContrast = false;
  prefHighContrast.classList.remove('active');
  updateAccessibility();
  showToast('Preferências locais resetadas.');
});

/**
 * Update the UI based on current state
 */
function updateUI() {
  const { color, size, radius, distance, blur, intensity, shape, direction } = state;

  // Calculate shadows
  const darkColor = colorLuminance(color, -intensity);
  const lightColor = colorLuminance(color, intensity);

  // Update Body Background
  document.body.style.backgroundColor = color;

  // Update CSS Variables for global consistency
  document.documentElement.style.setProperty('--bg-color', color);
  document.documentElement.style.setProperty('--dark-shadow', darkColor);
  document.documentElement.style.setProperty('--light-shadow', lightColor);
  document.documentElement.style.setProperty('--shadow-dist', `${distance}px`);
  document.documentElement.style.setProperty('--shadow-blur', `${blur}px`);

  // Update Labels data-value (for CSS pseudo-elements display)
  document.getElementById('labelSize').setAttribute('data-value', `${size}px`);
  document.getElementById('labelRadius').setAttribute('data-value', `${radius}px`);
  document.getElementById('labelDistance').setAttribute('data-value', `${distance}px`);
  document.getElementById('labelBlur').setAttribute('data-value', `${blur}px`);
  document.getElementById('labelIntensity').setAttribute('data-value', `${Math.round(intensity * 100)}%`);

  // Update Target Element
  targetElement.style.width = `${size}px`;
  targetElement.style.height = `${size}px`;
  targetElement.style.borderRadius = `${radius}px`;
  targetElement.style.backgroundColor = color;

  let boxShadow = '';
  let background = color;
  let angle = 145;
  let dx = distance;
  let dy = distance;

  switch (direction) {
    case 'top-left':
      dx = distance; dy = distance; angle = 145;
      break;
    case 'top-right':
      dx = -distance; dy = distance; angle = 225;
      break;
    case 'bottom-left':
      dx = distance; dy = -distance; angle = 45;
      break;
    case 'bottom-right':
      dx = -distance; dy = -distance; angle = 315;
      break;
  }

  if (shape === 'flat') {
    boxShadow = `${dx}px ${dy}px ${blur}px ${darkColor}, ${-dx}px ${-dy}px ${blur}px ${lightColor}`;
  } else if (shape === 'pressed') {
    boxShadow = `inset ${dx}px ${dy}px ${blur}px ${darkColor}, inset ${-dx}px ${-dy}px ${blur}px ${lightColor}`;
  } else if (shape === 'concave') {
    background = `linear-gradient(${angle}deg, ${darkColor}, ${lightColor})`;
    boxShadow = `${dx}px ${dy}px ${blur}px ${darkColor}, ${-dx}px ${-dy}px ${blur}px ${lightColor}`;
  } else if (shape === 'convex') {
    background = `linear-gradient(${angle}deg, ${lightColor}, ${darkColor})`;
    boxShadow = `${dx}px ${dy}px ${blur}px ${darkColor}, ${-dx}px ${-dy}px ${blur}px ${lightColor}`;
  }

  targetElement.style.boxShadow = boxShadow;
  targetElement.style.background = background;

  // Sync Inputs
  colorInput.value = color;
  colorText.value = color;
  sizeInput.value = size;
  radiusInput.value = radius;
  distanceInput.value = distance;
  blurInput.value = blur;
  intensityInput.value = intensity;

  shapeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === shape);
  });

  dirBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dir === direction);
  });

  // Update CSS Code Display
  const cssText = `border-radius: ${radius}px;
background: ${background};
box-shadow: ${boxShadow};`;
  
  cssCodeDisplay.textContent = cssText;
}

/**
 * Accessiblity Logic
 */
function updateAccessibility() {
  body.classList.toggle('high-contrast', state.isHighContrast);
  body.classList.toggle('clean-mode', state.isCleanMode);
  body.classList.toggle('reduce-motion', state.reduceMotion);
  body.classList.toggle('grayscale', state.isGrayscale);
  body.classList.toggle('underline-links', state.isUnderline);
  body.classList.toggle('big-cursor', state.isBigCursor);
  
  document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);

  // Update button visual states in panel
  if (toggleContrastBtn) toggleContrastBtn.classList.toggle('active', state.isHighContrast);
  if (toggleDistractionBtn) toggleDistractionBtn.classList.toggle('active', state.isCleanMode);
  if (toggleMotionBtn) toggleMotionBtn.classList.toggle('active', state.reduceMotion);
  if (toggleGrayscaleBtn) toggleGrayscaleBtn.classList.toggle('active', state.isGrayscale);
  if (toggleUnderlineBtn) toggleUnderlineBtn.classList.toggle('active', state.isUnderline);
  if (toggleCursorBtn) toggleCursorBtn.classList.toggle('active', state.isBigCursor);
}

function toggleAccPanel() {
  const isActive = accessibilityPanel.classList.toggle('active');
  toggleAccPanelBtn.setAttribute('aria-expanded', isActive);
}

/**
 * Auto-generate Design
 */
function generateRandomDesign() {
  const colors = ['#e6e9ef', '#f0f4f8', '#f7fafc', '#edf2f7', '#e2e8f0', '#fff5f5', '#fffaf0', '#f0fff4', '#f0ffff', '#f5f5ff'];
  state.color = colors[Math.floor(Math.random() * colors.length)];
  state.radius = Math.floor(Math.random() * 100);
  state.distance = Math.floor(Math.random() * 30) + 5;
  state.blur = state.distance * 2;
  state.intensity = (Math.random() * 0.15 + 0.1).toFixed(2);
  
  const shapes = ['flat', 'concave', 'convex', 'pressed'];
  state.shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  const directions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  state.direction = directions[Math.floor(Math.random() * directions.length)];
  
  updateUI();
}

/**
 * Save/Load Logic
 */
function saveDesign() {
  const name = prompt('Dê um nome ao seu design:', `Design ${savedDesigns.length + 1}`);
  if (!name) return;

  const newDesign = {
    id: Date.now(),
    name,
    date: new Date().toLocaleDateString(),
    config: { ...state }
  };

  savedDesigns.push(newDesign);
  localStorage.setItem('softui_saved_designs', JSON.stringify(savedDesigns));
  renderSavedDesigns();
}

function renderSavedDesigns() {
  if (savedDesigns.length === 0) {
    savedDesignsSection.style.display = 'none';
    return;
  }

  savedDesignsSection.style.display = 'block';
  savedGrid.innerHTML = '';

  savedDesigns.forEach(design => {
    const item = document.createElement('div');
    item.className = 'saved-item';
    
    // Tiny preview
    const dark = colorLuminance(design.config.color, -design.config.intensity);
    const light = colorLuminance(design.config.color, design.config.intensity);
    
    item.innerHTML = `
      <div class="saved-preview" style="background: ${design.config.color}; box-shadow: 4px 4px 8px ${dark}, -4px -4px 8px ${light}; border-radius: 8px;"></div>
      <div class="saved-info">
        <div class="saved-name">${design.name}</div>
        <div class="saved-date">${design.date}</div>
      </div>
      <div class="saved-actions">
        <button class="saved-btn load-btn" data-id="${design.id}">Abrir</button>
        <button class="saved-btn delete delete-btn" data-id="${design.id}">Excluir</button>
      </div>
    `;

    item.querySelector('.load-btn').onclick = () => loadDesign(design.id);
    item.querySelector('.delete-btn').onclick = () => deleteDesign(design.id);

    savedGrid.appendChild(item);
  });
}

function loadDesign(id) {
  const design = savedDesigns.find(d => d.id === id);
  if (design) {
    Object.assign(state, design.config);
    updateUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function deleteDesign(id) {
  if (confirm('Tem certeza que deseja excluir este design?')) {
    savedDesigns = savedDesigns.filter(d => d.id !== id);
    localStorage.setItem('softui_saved_designs', JSON.stringify(savedDesigns));
    renderSavedDesigns();
  }
}

/**
 * Advanced Export
 */
function exportJson() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'softui-config.json';
  a.click();
}

async function exportPng() {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(targetElement, {
    backgroundColor: state.color,
    scale: 2,
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'softui-design.png';
  a.click();
}

/**
 * Event Listeners Extensions
 */
randomBtn.addEventListener('click', generateRandomDesign);
saveDesignBtn.addEventListener('click', saveDesign);
exportJsonBtn.addEventListener('click', exportJson);
exportPngBtn.addEventListener('click', exportPng);

toggleContrastBtn.addEventListener('click', () => {
  state.isHighContrast = !state.isHighContrast;
  updateAccessibility();
});

fontUpBtn.addEventListener('click', () => {
  if (state.fontSize < 24) state.fontSize += 2;
  updateAccessibility();
});

fontDownBtn.addEventListener('click', () => {
  if (state.fontSize > 12) state.fontSize -= 2;
  updateAccessibility();
});

toggleDistractionBtn.addEventListener('click', () => {
  state.isCleanMode = !state.isCleanMode;
  updateAccessibility();
});

// Initial Render for Saved Items
renderSavedDesigns();
updateAccessibility();
colorInput.addEventListener('input', (e) => {
  state.color = e.target.value;
  colorText.value = e.target.value;
  updateUI();
});

colorText.addEventListener('input', (e) => {
  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
    state.color = e.target.value;
    colorInput.value = e.target.value;
    updateUI();
  }
});

sizeInput.addEventListener('input', (e) => {
  state.size = parseInt(e.target.value);
  updateUI();
});

radiusInput.addEventListener('input', (e) => {
  state.radius = parseInt(e.target.value);
  updateUI();
});

distanceInput.addEventListener('input', (e) => {
  state.distance = parseInt(e.target.value);
  updateUI();
});

blurInput.addEventListener('input', (e) => {
  state.blur = parseInt(e.target.value);
  updateUI();
});

intensityInput.addEventListener('input', (e) => {
  state.intensity = parseFloat(e.target.value);
  updateUI();
});

shapeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    shapeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.shape = btn.dataset.shape;
    updateUI();
  });
});

dirBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dirBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.direction = btn.dataset.dir;
    updateUI();
  });
});

copyBtn.addEventListener('click', () => {
  const text = cssCodeDisplay.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalContent = copyBtn.innerHTML;
    copyBtn.classList.add('success');
    copyBtn.textContent = 'Copiado!';
    setTimeout(() => {
      copyBtn.classList.remove('success');
      copyBtn.innerHTML = originalContent;
    }, 2000);
  });
});

// Initial Render
updateUI();

// Demo Switch Interactivity
const demoSwitch = document.getElementById('demoSwitch');
if (demoSwitch) {
  demoSwitch.addEventListener('click', () => {
    demoSwitch.classList.toggle('active');
  });
}

// Search Button Effect
const searchBtn = document.querySelector('.neu-search-btn');
if (searchBtn) {
  searchBtn.addEventListener('mousedown', () => {
    searchBtn.style.boxShadow = 'inset 2px 2px 4px var(--dark-shadow), inset -2px -2px 4px var(--light-shadow)';
  });
  searchBtn.addEventListener('mouseup', () => {
    searchBtn.style.boxShadow = '2px 2px 4px var(--dark-shadow), -2px -2px 4px var(--light-shadow)';
  });
  searchBtn.addEventListener('mouseleave', () => {
    searchBtn.style.boxShadow = '2px 2px 4px var(--dark-shadow), -2px -2px 4px var(--light-shadow)';
  });
}
