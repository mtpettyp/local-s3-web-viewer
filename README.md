# S3 Web Viewer

A React-based web UI for browsing and managing S3 buckets and objects. Designed to work with local S3-compatible services (like [LocalStack](https://localstack.cloud)) as well as AWS S3.

## Features

- Browse buckets and objects in a file-explorer interface
- View file contents with syntax highlighting
- Upload, download, move, rename, and delete files and folders
- Create and delete buckets
- Binary file detection with download option

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- An S3-compatible endpoint (e.g. LocalStack, MinIO, or AWS S3)

## Configuration

Copy the example config and fill in your credentials:

```bash
cp public/config.js.example public/config.js
```

Edit `public/config.js` with your S3 credentials:

```js
window.__CONFIG__ = {
  "accessKeyId": "your-access-key",
  "secretAccessKey": "your-secret-key",
  "region": "us-east-1"
};
```

## Running Locally

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173`. S3 requests are proxied through Vite's dev server to avoid CORS issues.

By default, the proxy points to `http://localhost:4566` (LocalStack). To use a different S3 endpoint, set the `S3_ENDPOINT` environment variable:

```bash
S3_ENDPOINT=http://localhost:9000 npm run dev
```

## Running with Docker

Build the image:

```bash
docker build -t s3-web-viewer .
```

Run the container:

```bash
docker run -p 8080:80 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  -e AWS_REGION=us-east-1 \
  -e S3_ENDPOINT=http://localstack:4566 \
  s3-web-viewer
```

The app is available at `http://localhost:8080`.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `test` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | `test` | AWS secret access key |
| `AWS_REGION` | `us-east-1` | AWS region |
| `S3_ENDPOINT` | `http://localhost:4566` | S3-compatible endpoint URL |

### How It Works

The Docker image uses a multi-stage build:

1. **Build stage** — Builds the React app with Vite
2. **Runtime stage** — Serves the built app with Nginx

At container startup, the entrypoint script injects the environment variables into `config.js` and configures the Nginx reverse proxy to forward S3 API requests to the specified endpoint.

## Releasing

Pushing a semver tag triggers a GitHub Actions workflow that builds a multi-arch Docker image (`amd64` + `arm64`), pushes it to Docker Hub, and creates a GitHub Release.

```bash
git tag v1.0.0
git push --tags
```

This produces Docker Hub tags `1.0.0`, `1.0`, `1`, and `latest`.

Images are pushed to [`mtpettyp/s3-web-viewer`](https://hub.docker.com/r/mtpettyp/s3-web-viewer) on Docker Hub.

### Setup

Configure this in your GitHub repository settings under **Settings > Secrets and variables > Actions**:

- **Secret:** `DOCKERHUB_TOKEN` — a Docker Hub [access token](https://hub.docker.com/settings/security)

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- AWS SDK for JavaScript (S3 Client)
