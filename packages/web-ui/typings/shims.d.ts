import { AxiosInterceptorManager, AxiosPromise, AxiosRequestConfig, AxiosResponse } from 'axios';

declare global {
  interface CustomAxiosInstance {
    interceptors: {
      request: AxiosInterceptorManager<AxiosRequestConfig>;
      response: AxiosInterceptorManager<AxiosResponse>;
    };

    request: <T = any>(config: AxiosRequestConfig) => Promise<T>;

    <T = any>(config: AxiosRequestConfig): Promise<T>;
  }
}
