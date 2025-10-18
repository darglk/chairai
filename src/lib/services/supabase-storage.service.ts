/**
 * Supabase Storage Service
 *
 * Handles image uploads to Supabase Storage bucket.
 * Converts base64 images to binary and uploads with proper metadata.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  fileName?: string;
}

const BUCKET_NAME = "chairai_bucket";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a base64 image to Supabase Storage
 *
 * @param supabase Supabase client instance
 * @param base64Data Base64 image data (with or without data URI prefix)
 * @param userId User ID for organizing files
 * @param metadata Optional metadata (contentType, etc)
 * @returns Upload result with public URL or error
 */
export async function uploadBase64Image(
  supabase: SupabaseClient,
  base64Data: string,
  userId: string,
  metadata?: {
    contentType?: string;
  }
): Promise<UploadImageResult> {
  try {
    if (!base64Data) {
      return {
        success: false,
        error: "Base64 data is required",
      };
    }

    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    let cleanBase64 = base64Data;
    if (base64Data.includes(",")) {
      cleanBase64 = base64Data.split(",")[1];
    }

    const buffer = Buffer.from(cleanBase64, "base64");

    if (buffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `Image size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${userId}/${timestamp}-${random}.png`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, {
      contentType: metadata?.contentType || "image/png",
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      // eslint-disable-next-line no-console
      console.error("[SupabaseStorageService] Upload error:", uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return {
        success: false,
        error: "Failed to generate public URL",
      };
    }

    // eslint-disable-next-line no-console
    console.log("[SupabaseStorageService] Image uploaded successfully:", fileName);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      fileName,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[SupabaseStorageService] Upload error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload",
    };
  }
}

/**
 * Delete an image from Supabase Storage
 *
 * @param supabase Supabase client instance
 * @param fileName File name (path) to delete
 * @returns Success status
 */
export async function deleteStorageImage(supabase: SupabaseClient, fileName: string): Promise<UploadImageResult> {
  try {
    if (!fileName) {
      return {
        success: false,
        error: "File name is required",
      };
    }

    const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("[SupabaseStorageService] Delete error:", deleteError);
      return {
        success: false,
        error: `Delete failed: ${deleteError.message}`,
      };
    }

    // eslint-disable-next-line no-console
    console.log("[SupabaseStorageService] Image deleted successfully:", fileName);

    return {
      success: true,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[SupabaseStorageService] Delete error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during deletion",
    };
  }
}
