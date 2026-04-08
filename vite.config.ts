import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const s3Endpoint = process.env.S3_ENDPOINT ?? "http://localhost:4566";

function configPlugin() {
  return {
    name: 'generate-config',
    configureServer() {
      const config = `window.__CONFIG__ = ${JSON.stringify({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
        region: process.env.AWS_REGION ?? "us-east-1",
      }, null, 2)};\n`;
      writeFileSync(resolve(__dirname, 'public/config.js'), config);
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    configPlugin(),
  ],
  server: {
    proxy: {
      '/s3': {
        target: s3Endpoint,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3/, ''),
      },
    },
  },
})
