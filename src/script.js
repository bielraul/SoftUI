import { onAuth, login, logout, checkAdminStatus } from './lib/auth-service';
import { loadUserProfile, saveProfile, uploadAvatar } from './lib/profile-service';
import { subscribeToDesigns, saveCloudDesign, deleteDesign } from './lib/designs-service';
import { state, updateState } from './state';
import { showToast, setSaveStatus } from './lib/ui-utils';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * DOM Elements Selection
 */
const generatorView = document.getElementById('generatorView');
const profileView = document.getElementById('profileView');
const designsView = document.getElementById('designsView');
const adminView = document.getElementById('adminView');

const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const topUserEmail = document.getElementById('topUserEmail');
const logoutFullBtn = document.getElementById('logoutFullBtn');
const navDesigns = document.querySelector('.tab-btn[data-tab="designs"]');

// Generator Core
const targetElement = document.getElementById('targetElement');
const colorInput = document.getElementById('colorInput');
const colorText = document.getElementById('colorText');
const sizeInput = document.getElementById('sizeInput');
const radiusInput = document.getElementById('radiusInput');
const distanceInput = document.getElementById('distanceInput');
const blurInput = document.getElementById('blurInput');
const intensityInput = document.getElementById('intensityInput');
const shapeBtns = document.querySelectorAll('.shape-btn');
const dirBtns = document.querySelectorAll('.dir-btn');
const cssCodeDisplay = document.getElementById('cssCode');
const copyBtn = document.getElementById('copyBtn');
const randomBtn = document.getElementById('randomBtn');
const saveDesignBtn = document.getElementById('saveDesignBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPngBtn = document.getElementById('exportPngBtn');

// Profile Elements
const profileAvatar = document.getElementById('profileAvatar');
const avatarUpload = document.getElementById('avatarUpload');
const avatarContainer = document.querySelector('.avatar-container');
const editDisplayName = document.getElementById('editDisplayName');
const editUsername = document.getElementById('editUsername');
const editBio = document.getElementById('editBio');
const prefTheme = document.getElementById('prefTheme');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileFullName = document.getElementById('profileFullName');
const profileEmail = document.getElementById('profileEmail');
const profileMemberSince = document.getElementById('profileMemberSince');
const profileProvider = document.getElementById('profileProvider');

// Designs Elements
const cloudSavedGrid = document.getElementById('cloudSavedGrid');
const cloudDesignCountBadge = document.getElementById('cloudDesignCountBadge');

// Accessibility
const accessibilityPanel = document.getElementById('accessibilityPanel');
const toggleAccPanelBtn = document.getElementById('toggleAccPanelBtn');
const closeAccPanelBtn = document.getElementById('closeAccPanelBtn');
const prefHighContrast = document.getElementById('prefHighContrast');
const toggleContrastBtn = document.getElementById('toggleContrastBtn');
const toggleDistractionBtn = document.getElementById('toggleDistractionBtn');
const toggleMotionBtn = document.getElementById('toggleMotionBtn');
const toggleGrayscaleBtn = document.getElementById('toggleGrayscaleBtn');
const toggleUnderlineBtn = document.getElementById('toggleUnderlineBtn');
const toggleCursorBtn = document.getElementById('toggleCursorBtn');
const fontUpBtn = document.getElementById('fontUpBtn');
const fontDownBtn = document.getElementById('fontDownBtn');
const resetAccBtn = document.getElementById('resetAccBtn');

// Dropdown
const userDropdown = document.getElementById('userDropdown');
const userDropdownTrigger = document.getElementById('userDropdownTrigger');
const logoutBtnTop = document.getElementById('logoutBtnTop');
const openAccBtn = document.getElementById('openAccDropdownBtn');

// Admin Elements
const adminTab = document.querySelector('.tab-btn[data-tab="admin"]');
const eventTitle = document.getElementById('eventTitle');
const eventStatus = document.getElementById('eventStatus');
const criteriaList = document.getElementById('criteriaList');
const addCriteriaBtn = document.getElementById('addCriteriaBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const criteriaName = document.getElementById('criteriaName');
const criteriaWeight = document.getElementById('criteriaWeight');
const criteriaMax = document.getElementById('criteriaMax');

/**
 * Navigation & Routing
 */
function handleRouting() {
  const hash = window.location.hash || '#/generator';
  const tab = hash.replace('#/', '');
  switchTab(tab);
}

function navigateTo(tabId) {
  window.location.hash = `#/${tabId}`;
}

function switchTab(tabId) {
  const allBtns = document.querySelectorAll('.tab-btn');
  allBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  
  if (generatorView) generatorView.classList.toggle('active', tabId === 'generator');
  if (adminView) adminView.classList.toggle('active', tabId === 'admin');
  if (profileView) profileView.classList.toggle('active', tabId === 'profile');
  if (designsView) designsView.classList.toggle('active', tabId === 'designs');

  if (tabId === 'admin' && !state.isAdmin) {
    navigateTo('generator');
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

/**
 * Authentication & Lifecycle
 */
onAuth(async (user) => {
  if (user) {
    updateState({ user });
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (userAvatar) userAvatar.src = user.photoURL || 'https://picsum.photos/seed/user/200';
    if (userName) userName.textContent = user.displayName || 'Usuário';
    if (topUserEmail) topUserEmail.textContent = user.email;
    if (navDesigns) navDesigns.style.display = 'block';
    
    try {
      await loadUserProfile(user);
      updateProfileUI();
      await checkAdminStatus(user.uid);
      if (adminTab) adminTab.style.display = state.isAdmin ? 'block' : 'none';
      
      subscribeToDesigns(user.uid, (designs) => {
        renderCloudDesigns(designs);
      });

      if (state.isAdmin) {
        loadJudgingConfig();
      }
    } catch (err) {
      console.error("Auth init error:", err);
    }
  } else {
    updateState({ user: null, isAdmin: false, userProfile: null, cloudDesigns: [] });
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
    if (adminTab) adminTab.style.display = 'none';
    if (navDesigns) navDesigns.style.display = 'none';
    navigateTo('generator');
  }
});

/**
 * User Profile UI Sync
 */
function updateProfileUI() {
  const p = state.userProfile;
  if (!p) return;

  if (profileAvatar) profileAvatar.src = p.photoURL || '';
  if (userAvatar) userAvatar.src = p.photoURL || '';
  if (profileFullName) profileFullName.textContent = p.displayName || 'Usuário';
  if (userName) userName.textContent = p.displayName || 'Usuário';
  if (profileEmail) profileEmail.textContent = p.email || '';
  if (profileMemberSince) profileMemberSince.textContent = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-';
  if (profileProvider) profileProvider.textContent = p.providerId || '-';

  if (editDisplayName) editDisplayName.value = p.displayName || '';
  if (editUsername) editUsername.value = p.username || '';
  if (editBio) editBio.value = p.bio || '';
  if (prefTheme) prefTheme.value = p.preferences?.theme || 'light';
  
  if (p.preferences) {
    applyPreferences(p.preferences);
  }
}

function applyPreferences(prefs) {
  if (!prefs) return;
  updateState({
    isHighContrast: prefs.highContrast || false,
    fontSize: prefs.fontSize || 16,
    isCleanMode: prefs.cleanMode || false,
    reduceMotion: prefs.reduceMotion || false,
    isGrayscale: prefs.isGrayscale || false,
    isUnderline: prefs.isUnderline || false,
    isBigCursor: prefs.isBigCursor || false
  });
  if (prefHighContrast) prefHighContrast.classList.toggle('active', state.isHighContrast);
  updateAccessibility();
}

/**
 * Cloud Designs UI Rendering
 */
function renderCloudDesigns(designs) {
  if (!cloudSavedGrid) return;
  cloudSavedGrid.innerHTML = '';
  if (cloudDesignCountBadge) cloudDesignCountBadge.textContent = `${designs.length} designs salvos`;

  if (designs.length === 0) {
    cloudSavedGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <p style="opacity: 0.5;">Você ainda não salvou designs na nuvem.</p>
      </div>
    `;
    return;
  }

  designs.forEach(design => {
    const card = document.createElement('div');
    card.className = 'config-card saved-card';
    card.innerHTML = `
      <div class="saved-preview" style="background: ${design.config.color}">
        <img src="${design.previewURL}" alt="${design.name}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
      <div class="saved-info">
        <p class="saved-name">${design.name}</p>
        <p class="saved-date">${new Date(design.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="saved-actions">
        <button class="action-pill primary load-cloud">Abrir</button>
        <button class="action-pill danger delete-cloud">Excluir</button>
      </div>
    `;

    card.querySelector('.load-cloud').onclick = () => {
      updateState(design.config);
      updateUI();
      navigateTo('generator');
      showToast(`Carregado: ${design.name}`);
    };

    card.querySelector('.delete-cloud').onclick = async () => {
      if (confirm('Deseja excluir este design permanentemente?')) {
        await deleteDesign(design.id);
      }
    };
    cloudSavedGrid.appendChild(card);
  });
}

/**
 * Neumorphism Core Logic
 */
function colorLuminance(hex, lum) {
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  lum = lum || 0;
  let rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }
  return rgb;
}

function updateUI() {
  const { color, size, radius, distance, blur, intensity, shape, direction } = state;
  const darkColor = colorLuminance(color, -intensity);
  const lightColor = colorLuminance(color, intensity);

  document.body.style.backgroundColor = color;
  document.documentElement.style.setProperty('--bg-color', color);
  document.documentElement.style.setProperty('--dark-shadow', darkColor);
  document.documentElement.style.setProperty('--light-shadow', lightColor);
  document.documentElement.style.setProperty('--shadow-dist', `${distance}px`);
  document.documentElement.style.setProperty('--shadow-blur', `${blur}px`);

  if (targetElement) {
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
      case 'top-left': dx = distance; dy = distance; angle = 145; break;
      case 'top-right': dx = -distance; dy = distance; angle = 225; break;
      case 'bottom-left': dx = distance; dy = -distance; angle = 45; break;
      case 'bottom-right': dx = -distance; dy = -distance; angle = 315; break;
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

    const cssText = `border-radius: ${radius}px;\nbackground: ${background};\nbox-shadow: ${boxShadow};`;
    if (cssCodeDisplay) cssCodeDisplay.textContent = cssText;
  }

  // Sync Form
  if (colorInput) colorInput.value = color;
  if (colorText) colorText.value = color;
  if (sizeInput) sizeInput.value = size;
  if (radiusInput) radiusInput.value = radius;
  if (distanceInput) distanceInput.value = distance;
  if (blurInput) blurInput.value = blur;
  if (intensityInput) intensityInput.value = intensity;

  shapeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.shape === shape));
  dirBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.dir === direction));
}

/**
 * Admin logic
 */
function renderCriteriaList() {
  if (!criteriaList) return;
  criteriaList.innerHTML = '';
  state.adminCriteria.forEach(c => {
    const div = document.createElement('div');
    div.className = 'criteria-item';
    div.innerHTML = `
      <div class="criteria-info"><h4>${c.name}</h4><p>Peso: ${c.weight} | Máx: ${c.maxScore}</p></div>
      <button class="saved-btn delete">Remover</button>
    `;
    div.querySelector('button').onclick = () => {
      state.adminCriteria = state.adminCriteria.filter(curr => curr.id !== c.id);
      renderCriteriaList();
    };
    criteriaList.appendChild(div);
  });
}

function addCriteria() {
  const name = criteriaName.value.trim();
  if (!name) return;
  state.adminCriteria.push({ id: Date.now(), name, weight: parseFloat(criteriaWeight.value), maxScore: parseFloat(criteriaMax.value) });
  criteriaName.value = '';
  renderCriteriaList();
}

async function loadJudgingConfig() {
  const snap = await getDoc(doc(db, 'configs', state.adminConfigId));
  if (snap.exists()) {
    const data = snap.data();
    if (eventTitle) eventTitle.value = data.title;
    if (eventStatus) eventStatus.value = data.status;
    state.adminCriteria = data.criteria || [];
    renderCriteriaList();
  }
}

async function saveJudgingConfig() {
  if (!state.user || !state.isAdmin) return;
  try {
    await setDoc(doc(db, 'configs', state.adminConfigId), {
      title: eventTitle.value, status: eventStatus.value, criteria: state.adminCriteria,
      updatedAt: new Date(), updatedBy: state.user.uid
    });
    showToast("Configuração salva!");
  } catch (err) { console.error(err); }
}

/**
 * Global Utilities
 */
function updateAccessibility() {
  const body = document.body;
  body.classList.toggle('high-contrast', state.isHighContrast);
  body.classList.toggle('clean-mode', state.isCleanMode);
  body.classList.toggle('reduce-motion', state.reduceMotion);
  body.classList.toggle('grayscale', state.isGrayscale);
  body.classList.toggle('underline-links', state.isUnderline);
  body.classList.toggle('big-cursor', state.isBigCursor);
  document.documentElement.style.setProperty('--base-font-size', `${state.fontSize}px`);
}

function toggleAccPanel() {
  accessibilityPanel.classList.toggle('active');
}

function generateRandomDesign() {
  const colors = ['#e6e9ef', '#f0f4f8', '#f7fafc', '#edf2f7', '#e2e8f0'];
  updateState({
    color: colors[Math.floor(Math.random() * colors.length)],
    radius: Math.floor(Math.random() * 100),
    distance: Math.floor(Math.random() * 30) + 5,
    blur: 40,
    intensity: 0.15,
    shape: 'flat'
  });
  updateUI();
}

/**
 * Event Listeners
 */
if (loginBtn) loginBtn.onclick = login;
if (logoutFullBtn) logoutFullBtn.onclick = logout;
if (logoutBtnTop) logoutBtnTop.onclick = logout;

if (userInfo) userInfo.onclick = (e) => { e.stopPropagation(); if(state.user) navigateTo('profile'); };
if (userDropdownTrigger) userDropdownTrigger.onclick = (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); };
document.addEventListener('click', () => userDropdown && userDropdown.classList.remove('active'));

const initNav = () => document.querySelectorAll('.tab-btn, .dropdown-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', (e) => { e.preventDefault(); navigateTo(btn.dataset.tab); userDropdown.classList.remove('active'); });
});
initNav();

if (colorInput) colorInput.oninput = (e) => { updateState({ color: e.target.value }); if(colorText) colorText.value = e.target.value; updateUI(); };
if (colorText) colorText.oninput = (e) => { if(/^#[0-9A-F]{6}$/i.test(e.target.value)) { updateState({ color: e.target.value }); if(colorInput) colorInput.value = e.target.value; updateUI(); } };

[sizeInput, radiusInput, distanceInput, blurInput].forEach(el => {
  if (el) el.oninput = (e) => { updateState({ [el.id.replace('Input', '')]: parseInt(e.target.value) }); updateUI(); };
});
if (intensityInput) intensityInput.oninput = (e) => { updateState({ intensity: parseFloat(e.target.value) }); updateUI(); };

shapeBtns.forEach(btn => btn.onclick = () => { updateState({ shape: btn.dataset.shape }); updateUI(); });
dirBtns.forEach(btn => btn.onclick = () => { updateState({ direction: btn.dataset.dir }); updateUI(); });

if (copyBtn) copyBtn.onclick = () => {
  navigator.clipboard.writeText(cssCodeDisplay.textContent).then(() => {
    const orig = copyBtn.innerHTML; copyBtn.textContent = 'Copiado!';
    setTimeout(() => copyBtn.innerHTML = orig, 2000);
  });
};

if (randomBtn) randomBtn.onclick = generateRandomDesign;
if (exportJsonBtn) exportJsonBtn.onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'design.json'; a.click();
};
if (exportPngBtn) exportPngBtn.onclick = async () => {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(targetElement, { backgroundColor: state.color, scale: 2 });
  const a = document.createElement('a'); a.href = canvas.toDataURL(); a.download = 'design.png'; a.click();
};

if (saveDesignBtn) saveDesignBtn.onclick = async () => {
  if (!state.user) { showToast('Faça login para salvar na nuvem'); return; }
  const name = prompt('Nome do design:', `Meu Design ${state.cloudDesigns.length + 1}`);
  if (name) await saveCloudDesign(name, targetElement, state);
};

if (saveProfileBtn) saveProfileBtn.onclick = async () => {
  const data = { 
    displayName: editDisplayName.value, username: editUsername.value, bio: editBio.value,
    preferences: { theme: prefTheme.value, highContrast: state.isHighContrast, fontSize: state.fontSize }
  };
  await saveProfile(data); updateProfileUI();
};

if (avatarContainer) avatarContainer.onclick = () => avatarUpload.click();
if (avatarUpload) avatarUpload.onchange = async (e) => {
  if (e.target.files[0]) { await uploadAvatar(e.target.files[0]); updateProfileUI(); }
};

if (toggleAccPanelBtn) toggleAccPanelBtn.onclick = toggleAccPanel;
if (closeAccPanelBtn) closeAccPanelBtn.onclick = () => accessibilityPanel.classList.remove('active');
if (openAccBtn) openAccBtn.onclick = (e) => { e.preventDefault(); toggleAccPanel(); userDropdown.classList.remove('active'); };

if (toggleContrastBtn) toggleContrastBtn.onclick = () => { updateState({ isHighContrast: !state.isHighContrast }); updateAccessibility(); };
if (fontUpBtn) fontUpBtn.onclick = () => { if(state.fontSize < 24) updateState({ fontSize: state.fontSize + 2}); updateAccessibility(); };
if (fontDownBtn) fontDownBtn.onclick = () => { if(state.fontSize > 12) updateState({ fontSize: state.fontSize - 2}); updateAccessibility(); };

if (addCriteriaBtn) addCriteriaBtn.onclick = addCriteria;
if (saveConfigBtn) saveConfigBtn.onclick = saveJudgingConfig;

/**
 * Initial Render
 */
updateUI();
updateAccessibility();
