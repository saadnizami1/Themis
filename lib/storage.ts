import { StorageClient } from '@supabase/storage-js';
import fs from 'fs';
import path from 'path';

// Storage abstraction: Supabase Storage in production (serverless-safe),
// local filesystem fallback for development without Supabase configured.
//
// Uses the standalone storage client (not the full supabase-js client, whose
// realtime module requires WebSocket support absent from Node 20).
//
// Stored paths are recorded as "supabase://<bucket>/<key>" or a local fs path.

let client: StorageClient | null = null;

function getStorage(): StorageClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = new StorageClient(`${url}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
  return client;
}

async function ensureBucket(sb: StorageClient, bucket: string) {
  const { data } = await sb.getBucket(bucket);
  if (!data) {
    await sb.createBucket(bucket, { public: false });
  }
}

export async function storeFile(
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const sb = getStorage();
  if (sb) {
    await ensureBucket(sb, bucket);
    const { error } = await sb.from(bucket).upload(key, buffer, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return `supabase://${bucket}/${key}`;
  }

  // Local fallback
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const dir = path.join(uploadDir, bucket);
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, key.replace(/\//g, '_'));
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

// Signed upload URL so large files (interview videos) go from the browser
// straight to Supabase Storage, bypassing serverless body-size limits.
// Returns null when Supabase isn't configured (local dev falls back to proxy upload).
export async function createSignedUpload(
  bucket: string,
  key: string
): Promise<{ signedUrl: string; storedPath: string } | null> {
  const sb = getStorage();
  if (!sb) return null;
  await ensureBucket(sb, bucket);
  const { data, error } = await sb.from(bucket).createSignedUploadUrl(key, { upsert: true });
  if (error || !data) throw new Error(`Signed upload failed: ${error?.message}`);
  return { signedUrl: data.signedUrl, storedPath: `supabase://${bucket}/${key}` };
}

// Time-limited signed download URL for supabase-stored files, so playback
// streams directly from storage instead of proxying through a function.
export async function createSignedDownloadUrl(storedPath: string): Promise<string | null> {
  if (!storedPath.startsWith('supabase://')) return null;
  const sb = getStorage();
  if (!sb) return null;
  const rest = storedPath.slice('supabase://'.length);
  const slash = rest.indexOf('/');
  const bucket = rest.slice(0, slash);
  const key = rest.slice(slash + 1);
  const { data, error } = await sb.from(bucket).createSignedUrl(key, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function retrieveFile(storedPath: string): Promise<Buffer | null> {
  if (storedPath.startsWith('supabase://')) {
    const sb = getStorage();
    if (!sb) return null;
    const rest = storedPath.slice('supabase://'.length);
    const slash = rest.indexOf('/');
    const bucket = rest.slice(0, slash);
    const key = rest.slice(slash + 1);
    const { data, error } = await sb.from(bucket).download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }

  try {
    return fs.readFileSync(storedPath);
  } catch {
    return null;
  }
}
