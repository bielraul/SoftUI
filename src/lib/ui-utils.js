export function showToast(message, type = 'success') {
  const feedbackToast = document.getElementById('feedbackToast');
  if (!feedbackToast) return;
  feedbackToast.textContent = message;
  feedbackToast.className = `feedback-toast active ${type}`;
  setTimeout(() => {
    feedbackToast.classList.remove('active');
  }, 3000);
}

export function setSaveStatus(text, type = 'info') {
  const saveStatus = document.getElementById('saveStatus');
  if (!saveStatus) return;
  saveStatus.textContent = text;
  saveStatus.style.opacity = '1';
  switch(type) {
    case 'success': saveStatus.style.color = 'var(--accent-green)'; break;
    case 'error': saveStatus.style.color = '#e53e3e'; break;
    default: saveStatus.style.color = 'var(--text-color)';
  }
}
