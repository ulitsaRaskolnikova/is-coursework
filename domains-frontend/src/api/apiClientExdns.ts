import Axios, { type AxiosRequestConfig } from 'axios';
import { EXDNS_TOKEN, EXDNS_URL } from './Constants';

const AUTH_HEADER = 'authentication';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: EXDNS_URL,
});

const applyToken = (config: AxiosRequestConfig) => {
  if (!EXDNS_TOKEN) return;

  const headers = config.headers ?? {};
  if (
    typeof (headers as { set?: (k: string, v: string) => void }).set ===
    'function'
  ) {
    (headers as { set: (k: string, v: string) => void }).set(
      AUTH_HEADER,
      `Bearer ${EXDNS_TOKEN}`
    );
  } else {
    (headers as Record<string, string>)[AUTH_HEADER] = `Bearer ${EXDNS_TOKEN}`;
  }
  config.headers = headers;
};

AXIOS_INSTANCE.interceptors.request.use((config) => {
  applyToken(config);
  return config;
});

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};
