import { supabase } from "@/integrations/supabase/client";

export const DEVICE_ASSET_BUCKET = "device-assets";
const PREFIX = `${DEVICE_ASSET_BUCKET}/`;

/** True for values that point at an uploaded file in the private device bucket. */
export function isStoredAsset(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}

export function storedAssetPath(value: string): string {
  return value.slice(PREFIX.length);
}

/**
 * Resolve a device image / file reference to something a browser can open.
 * Plain URLs (http… or /local.png) pass through; uploaded files get a
 * short-lived signed URL because the bucket is private.
 */
export async function resolveDeviceAsset(
  value: string | null | undefined,
  opts: { download?: boolean } = {},
): Promise<string | null> {
  if (!value) return null;
  if (!isStoredAsset(value)) return value;
  const path = storedAssetPath(value);
  const { data, error } = await supabase.storage
    .from(DEVICE_ASSET_BUCKET)
    .createSignedUrl(path, 60 * 60, opts.download ? { download: true } : undefined);
  if (error) return null;
  return data.signedUrl;
}

/** Upload a file to the shared device bucket (admin-only via storage policies). */
export async function uploadDeviceAsset(file: File, folder: "images" | "files") {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(DEVICE_ASSET_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return `${PREFIX}${path}`;
}

export function assetLabel(value: string | null | undefined): string {
  if (!value) return "";
  if (!isStoredAsset(value)) return value;
  return storedAssetPath(value).split("/").pop() ?? value;
}
