import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from './config';

let supabaseClient: SupabaseClient | null = null;
let bucketEnsured = false;

export function isSupabaseStorageEnabled(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (!isSupabaseStorageEnabled()) {
    return null;
  }
  supabaseClient = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabaseClient;
}

export async function ensureBucketExists(client: SupabaseClient, bucket: string): Promise<boolean> {
  if (bucketEnsured) return true;
  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      console.warn('⚠️  Could not list Supabase storage buckets:', error.message);
      // Attempt upload even if listing fails (listing might be restricted)
      return true;
    }
    const exists = buckets?.some(b => b.name === bucket);
    if (!exists) {
      const { error: createError } = await client.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      if (createError) {
        console.warn(`⚠️  Could not auto-create Supabase storage bucket "${bucket}":`, createError.message);
      } else {
        console.log(`✅ Created public Supabase Storage bucket "${bucket}"`);
      }
    }
    bucketEnsured = true;
    return true;
  } catch (err) {
    console.warn('⚠️  Error checking/creating Supabase bucket:', err);
    return true;
  }
}

/**
 * Upload a local file to Supabase Storage and return its public URL.
 * Returns null if Supabase is not configured or if upload fails.
 */
export async function uploadToSupabaseStorage(
  filePath: string,
  destinationPath: string,
  contentType = 'image/webp'
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const bucket = config.supabase.bucket;

  try {
    await ensureBucketExists(client, bucket);

    const fileBuffer = fs.readFileSync(filePath);
    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(destinationPath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ Supabase upload failed for "${destinationPath}":`, uploadError.message);
      return null;
    }

    const { data } = client.storage.from(bucket).getPublicUrl(destinationPath);
    return data.publicUrl;
  } catch (err) {
    console.error(`❌ Exception during Supabase upload for "${destinationPath}":`, err);
    return null;
  }
}

