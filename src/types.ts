export interface S3Bucket {
  name: string;
  creationDate?: Date;
}

export interface S3Object {
  key: string;
  name: string;
  size: number;
  lastModified?: Date;
  etag?: string;
  isFolder: boolean;
}

export interface S3Folder {
  prefix: string;
  name: string;
}

export type ViewState =
  | { type: "list" }
  | { type: "file"; bucket: string; key: string; name: string; size: number; lastModified?: Date };

export interface ToastMessage {
  id: string;
  message: string;
  type: "error" | "success";
}
