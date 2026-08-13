import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary holds every image the app stores — news/blog posts, member photos,
 * and the standalone club gallery — split into folders below.
 * Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = 'kcsc/news';
export const CLOUDINARY_MEMBERS_FOLDER = 'kcsc/members';
export const CLOUDINARY_GALLERY_FOLDER = 'kcsc/gallery';

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export type UploadedImage = { url: string; publicId: string; width: number; height: number };

/** Uploads raw image bytes and returns the stored URL plus the public_id needed to delete it later. */
export async function uploadImage(
  buffer: Buffer,
  filename?: string,
  folder: string = CLOUDINARY_FOLDER
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined,
        unique_filename: true,
        overwrite: false,
        // Cap the stored asset — club photos come straight off phones at 4000px+.
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Best-effort asset cleanup — a failure here must not block deleting the post itself. */
export async function deleteImage(publicId?: string | null) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error('Cloudinary delete failed for', publicId, e);
  }
}

export default cloudinary;
