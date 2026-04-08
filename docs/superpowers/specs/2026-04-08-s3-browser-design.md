# S3 Browser — Design Spec

## Overview

A static React web app for browsing and managing S3 buckets exposed by LocalStack/MiniStack/Floci. Runs in a Docker container with Nginx serving the built assets. The browser communicates directly with the S3-compatible endpoint using AWS SDK v3.

Reimplements the core functionality of the [localstack_s3_browser](https://github.com/mtpettyp/localstack_s3_browser) IntelliJ plugin as a standalone web app.

## Configuration

Environment variables injected at container startup via `entrypoint.sh`:

| Variable | Default | Description |
|----------|---------|-------------|
| `S3_ENDPOINT` | `http://localhost:4566` | S3-compatible endpoint URL |
| `AWS_ACCESS_KEY_ID` | `test` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | `test` | AWS secret key |
| `AWS_REGION` | `us-east-1` | AWS region |

**Injection mechanism:** `entrypoint.sh` writes env vars to `/usr/share/nginx/html/config.js` as `window.__CONFIG__` before starting Nginx. `index.html` loads this script before the React bundle.

No UI-based configuration. All config comes from environment variables only.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling (dark theme)
- **AWS SDK v3** (`@aws-sdk/client-s3`) — browser calls S3 directly
- **react-syntax-highlighter** for file viewer
- **Nginx Alpine** as container base for serving static files

## Architecture

```
Docker Container (nginx:alpine)
├── entrypoint.sh        → reads env vars, writes config.js, starts nginx
├── nginx.conf           → serves static files, SPA fallback
└── /usr/share/nginx/html/
    ├── config.js        → generated at startup from env vars
    ├── index.html       → loads config.js then React bundle
    └── assets/          → Vite build output

Browser ←── S3 API (direct) ──→ LocalStack (port 4566)
```

CORS must be enabled on the S3 endpoint. LocalStack enables this by default.

## Layout

Two-panel explorer layout:

```
┌──────────────────────────────────────────────────┐
│  Top Bar: App name, endpoint, connection status  │
├────────────┬─────────────────────────────────────┤
│  Sidebar   │  Breadcrumb bar + action buttons    │
│            ├─────────────────────────────────────┤
│  Bucket    │                                     │
│  and       │  File list (table)                  │
│  folder    │  OR                                 │
│  tree      │  File viewer (replaces file list)   │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

- **Top bar:** App name, connected endpoint URL, connection status indicator.
- **Sidebar:** Lists buckets at root level. Buckets expand to show folder tree. Clicking a bucket or folder navigates the right panel.
- **Breadcrumb bar:** Shows current path. Breadcrumb segments are clickable for navigation. Hosts action buttons (New Folder, Upload, Create Bucket).
- **File list:** Table with columns: Name, Size, Modified, Actions (⋯ menu). Folders listed first, then files. Clicking a folder drills in. Clicking a file opens the viewer.
- **File viewer:** Replaces the file list. Shows "← Back" button, file path, metadata bar (size, modified, content type), and syntax-highlighted content with line numbers. Download button in the header. For non-text files, shows metadata and download only.

## Features

### Bucket Management
- **List buckets:** `ListBucketsCommand` → populates sidebar
- **Create bucket:** `CreateBucketCommand` → modal dialog with name input
- **Delete bucket:** `DeleteBucketCommand` → confirmation dialog, must recursively delete all objects first

### Object Browsing
- **List objects:** `ListObjectsV2Command` with `Prefix` and `Delimiter="/"` → one level at a time
- **Navigate folders:** Clicking a folder updates the prefix and refreshes the file list
- **Breadcrumb navigation:** Click any segment to jump to that level

### File Viewer
- **View file:** `GetObjectCommand` → stream body to string
- **Syntax highlighting:** Based on file extension using react-syntax-highlighter
- **Line numbers:** Displayed in the gutter
- **Metadata:** Size, last modified, content type shown in a bar above content
- **Non-text files:** Show metadata and download button only, no content preview

### File Operations
- **Upload:** `PutObjectCommand` from browser File input. Upload dialog with file picker.
- **Download:** `GetObjectCommand` → create blob URL → trigger browser download
- **Create folder:** `PutObjectCommand` with key ending in `/` and empty body
- **Delete file:** `DeleteObjectCommand` with confirmation dialog
- **Delete folder:** `ListObjectsV2Command` to list all objects under prefix, then `DeleteObjectsCommand` to batch delete. Confirmation dialog warns about recursive deletion.
- **Rename:** `CopyObjectCommand` to new key + `DeleteObjectCommand` on old key. For folders, applies recursively to all objects under the prefix.
- **Move:** Same as rename but with a different prefix. For folders, applies recursively to all objects under the prefix. Modal with folder picker for destination.

### Action Menus

**File actions (⋯ menu):** Download, Rename, Move to..., Delete

**Folder actions (⋯ menu):** Rename, Move to..., Delete (recursive)

**Bucket actions (sidebar):** Delete bucket

### Error Handling
- Connection failures show an error state in the top bar
- Failed S3 operations show a toast/notification with the error message
- Retry-able operations (list, view) can be retried via refresh

## Component Structure

```
src/
├── config.ts              # Reads window.__CONFIG__, exports typed config
├── s3Client.ts            # AWS SDK v3 S3Client singleton (forcePathStyle: true)
├── App.tsx                # Root layout: sidebar + main panel
├── components/
│   ├── Sidebar.tsx        # Bucket list + folder tree (recursive)
│   ├── BreadcrumbBar.tsx  # Path navigation + action buttons
│   ├── FileList.tsx       # Table of objects in current prefix
│   ├── FileViewer.tsx     # Syntax-highlighted read-only viewer
│   ├── CreateBucketDialog.tsx
│   ├── CreateFolderDialog.tsx
│   ├── UploadDialog.tsx
│   ├── RenameDialog.tsx
│   ├── MoveDialog.tsx     # Folder picker for move destination
│   └── ConfirmDialog.tsx  # Reusable delete confirmation
├── hooks/
│   ├── useS3Buckets.ts    # List/create/delete buckets
│   ├── useS3Objects.ts    # List/upload/delete/rename/move objects
│   └── useS3Content.ts   # Fetch object content for viewer
└── types.ts               # Shared types
```

**State management:** React state + hooks. No global store. S3 API is the source of truth. Navigation state (current bucket, prefix, selected file) held in App component.

**Refresh behavior:** After any mutation (create, delete, rename, move, upload), the current view re-fetches from S3.

## S3 Client Configuration

```typescript
const client = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,  // Required for LocalStack
});
```

## Container

**Dockerfile (multi-stage):**
1. **Build stage:** `node:alpine` — install deps, run `vite build`
2. **Production stage:** `nginx:alpine` — copy build output, nginx.conf, entrypoint.sh

**entrypoint.sh:** Reads env vars with defaults, writes `config.js`, execs `nginx -g 'daemon off;'`.

**nginx.conf:** Serves static files from `/usr/share/nginx/html/`, `try_files $uri /index.html` for SPA routing.

**Usage:**
```bash
docker build -t s3-browser .
docker run -p 8080:80 \
  -e S3_ENDPOINT=http://localhost:4566 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  s3-browser
```

## Visual Design

- Dark theme throughout (slate/navy palette)
- Developer-focused aesthetic
- Monospace font for file viewer
- Subtle borders and muted colors for secondary information
- Blue accent for interactive elements and primary actions
- Amber/yellow for bucket icons, standard folder/file icons elsewhere
