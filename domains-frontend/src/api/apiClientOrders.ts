import Axios, { type AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens } from '~/utils/authTokens';
import { ORDER_URL } from './Constants';

const AUTH_HEADER = 'Authorization';

export const ORDER_AXIOS_INSTANCE = Axios.create({
  baseURL: ORDER_URL,
});

const refreshClient = Axios.create({
  baseURL: ORDER_URL,
});

const isRefreshRequest = (url?: string) => url?.includes('/auth/refresh');

const applyAccessToken = (config: AxiosRequestConfig, accessToken?: string) => {
  if (!accessToken) return;
  if (isRefreshRequest(config.url)) return;

  const headers = config.headers ?? {};
  if (
    typeof (headers as { set?: (k: string, v: string) => void }).set ===
    'function'
  ) {
    (headers as { set: (k: string, v: string) => void }).set(
      AUTH_HEADER,
      `Bearer ${accessToken}`
    );
  } else {
    (headers as Record<string, string>)[AUTH_HEADER] = `Bearer ${accessToken}`;
  }
  config.headers = headers;
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const { data } = await refreshClient.post('/auth/refresh', {
    refreshToken,
  });

  const accessToken = data?.data?.accessToken;
  const nextRefreshToken = data?.data?.refreshToken ?? refreshToken;

  if (!accessToken) {
    return null;
  }

  setTokens({ access: accessToken, refresh: nextRefreshToken });

  return accessToken;
};

ORDER_AXIOS_INSTANCE.interceptors.request.use((config) => {
  applyAccessToken(config, getAccessToken());
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

ORDER_AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalConfig = error?.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalConfig || status !== 403 || originalConfig._retry) {
      return Promise.reject(error);
    }

    if (isRefreshRequest(originalConfig.url)) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const accessToken = await refreshPromise;
    if (!accessToken) {
      return Promise.reject(error);
    }

    applyAccessToken(originalConfig, accessToken);
    return ORDER_AXIOS_INSTANCE(originalConfig);
  }
);

export const orderCustomInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const promise = ORDER_AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};
