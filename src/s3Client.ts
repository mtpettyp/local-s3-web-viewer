import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./config";

export const s3Client = new S3Client({
  endpoint: window.location.origin + "/s3",
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
});
