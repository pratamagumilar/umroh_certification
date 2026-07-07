import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'umroh-storage';

let supabase: any = null;

if (STORAGE_PROVIDER === 'supabase') {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing, but STORAGE_PROVIDER is 'supabase'.");
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
}

/**
 * Uploads a file to the configured storage provider.
 * 
 * @param buffer The file data
 * @param folder The target folder (e.g., 'materials' or 'certificates')
 * @param fileName The name of the file (e.g., 'uuid.pdf' or '2026/07/uuid.pdf')
 * @param mimeType The file mime type (e.g., 'application/pdf')
 * @returns The relative path for local storage, or the absolute public URL for Supabase
 */
export async function uploadFile(
  buffer: Buffer,
  folder: 'materials' | 'certificates',
  fileName: string,
  mimeType: string = 'application/pdf'
): Promise<string> {
  if (STORAGE_PROVIDER === 'supabase' && supabase) {
    // Unggah ke Supabase
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    // Ambil Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } else {
    // Unggah Lokal (Default)
    if (folder === 'materials') {
      const storageDir = process.env.STORAGE_DIR || './storage';
      const baseDir = path.isAbsolute(storageDir) ? storageDir : path.join(process.cwd(), storageDir);
      
      const fullPath = path.join(baseDir, folder, fileName);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, buffer);
      
      // Return relative path for DB
      return `/${folder}/${fileName}`;
    } else if (folder === 'certificates') {
      const publicDir = path.join(process.cwd(), 'public', 'certificates');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      const filePath = path.join(publicDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      // Return relative path for DB
      return `/certificates/${fileName}`;
    }
    
    throw new Error('Unsupported folder for local storage');
  }
}
