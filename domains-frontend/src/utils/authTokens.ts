type TokenState = {
  access?: string;
  refresh?: string;
};

const STORAGE_KEY_REFRESH = 'hrofors_refresh';
const STORAGE_KEY_ACCESS = 'hrofors_access';

const getWindowStore = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  if (!window._hrofors) {
    window._hrofors = {};
  }

  return window._hrofors;
};

const readStoredRefresh = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return localStorage.getItem(STORAGE_KEY_REFRESH) || undefined;
};

const readStoredAccess = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return localStorage.getItem(STORAGE_KEY_ACCESS) || undefined;
};

export const getAccessToken = () => {
  const store = getWindowStore();
  const stored = readStoredAccess();

  if (store && !store.access && stored) {
    store.access = stored;
  }

  return store?.access ?? stored;
};

export const getRefreshToken = () => {
  const store = getWindowStore();
  const stored = readStoredRefresh();

  if (store && !store.refresh && stored) {
    store.refresh = stored;
  }

  return store?.refresh ?? stored;
};

export const setTokens = ({ access, refresh }: TokenState) => {
  const store = getWindowStore();

  if (store) {
    if (access !== undefined) {
      store.access = access;
    }
    if (refresh !== undefined) {
      store.refresh = refresh;
    }
  }

  if (typeof window !== 'undefined') {
    if (access !== undefined) {
      if (access) {
        localStorage.setItem(STORAGE_KEY_ACCESS, access);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACCESS);
      }
    }
    if (refresh !== undefined) {
      if (refresh) {
        localStorage.setItem(STORAGE_KEY_REFRESH, refresh);
      } else {
        localStorage.removeItem(STORAGE_KEY_REFRESH);
      }
    }
  }
};
