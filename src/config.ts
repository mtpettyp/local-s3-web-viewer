interface AppConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

declare global {
  interface Window {
    __CONFIG__: AppConfig;
  }
}

export const config: AppConfig = {
  endpoint: window.__CONFIG__?.endpoint ?? "http://localhost:4566",
  accessKeyId: window.__CONFIG__?.accessKeyId ?? "test",
  secretAccessKey: window.__CONFIG__?.secretAccessKey ?? "test",
  region: window.__CONFIG__?.region ?? "us-east-1",
};
