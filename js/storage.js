const STORAGE_KEY = "lab03_plataforma_state_v1";

export function loadPlatformState(plataforma) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const state = JSON.parse(raw);
    plataforma.loadState(state);
    return true;
  } catch {
    return false;
  }
}

export function savePlatformState(plataforma) {
  try {
    const state = plataforma.exportState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearPlatformState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
