type TokenState = {
  access?: string;
  refresh?: string;
};

const STORAGE_KEY = 'hrofors_refresh';

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

  return localStorage.getItem(STORAGE_KEY) || undefined;
};

export const getAccessToken = () => getWindowStore()?.access;

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

  if (typeof window !== 'undefined' && refresh !== undefined) {
    if (refresh) {
      localStorage.setItem(STORAGE_KEY, refresh);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
