const prefix = 'meme-lab:draft:v1:';

export function draftKey(owner, entry) {
  return prefix + owner + ':' + entry;
}

export function readDraft(key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key));
    return draft && typeof draft.layout === 'object' ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(key, draft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // The browser may block storage or have no space left.
  }
}

export function clearDraft(key) {
  try { localStorage.removeItem(key); }
  catch { /* Storage may be unavailable. */ }
}
