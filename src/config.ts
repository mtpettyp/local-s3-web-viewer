interface AppConfig {
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
  accessKeyId: window.__CONFIG__?.accessKeyId ?? "test",
  secretAccessKey: window.__CONFIG__?.secretAccessKey ?? "test",
  region: window.__CONFIG__?.region ?? "us-east-1",
};
