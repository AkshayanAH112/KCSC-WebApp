import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import imageSize from 'image-size';
import sharp from 'sharp';

// Cloudinary used to cap every upload to this before storing it — phone
// camera photos come in at 4000px+ and several MB, which is both wasteful to
// store and (this bit as a real bug) slow enough to fetch cross-region that
// it can blow past next/image's optimizer timeout.
const MAX_DIMENSION = 1600;

/**
 * DigitalOcean Spaces (S3-compatible) holds every image the app stores —
 * news/blog posts, member photos, and the standalone club gallery — split
 * into key prefixes below.
 * Required env vars: DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_BUCKET,
 * DO_SPACES_KEY, DO_SPACES_SECRET. Optional: DO_SPACES_CDN_ENDPOINT.
 */
const client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY ?? '',
    secretAccessKey: process.env.DO_SPACES_SECRET ?? '',
  },
});

const BUCKET = process.env.DO_SPACES_BUCKET ?? '';

export const SPACES_NEWS_FOLDER = 'kcsc/news';
export const SPACES_MEMBERS_FOLDER = 'kcsc/members';
export const SPACES_GALLERY_FOLDER = 'kcsc/gallery';
export const SPACES_PAYMENTS_FOLDER = 'kcsc/payments';

export function isSpacesConfigured() {
  return Boolean(
    process.env.DO_SPACES_ENDPOINT &&
      process.env.DO_SPACES_REGION &&
      process.env.DO_SPACES_BUCKET &&
      process.env.DO_SPACES_KEY &&
      process.env.DO_SPACES_SECRET
  );
}

function publicUrlFor(key: string) {
  const cdn = process.env.DO_SPACES_CDN_ENDPOINT;
  if (cdn) return `${cdn.replace(/\/$/, '')}/${key}`;
  return `https://${BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`;
}

function sanitizeFilename(filename?: string) {
  const base = (filename ?? 'image').replace(/\.[^.]+$/, '');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'image';
}

export type UploadedImage = { url: string; publicId: string; width: number; height: number };

/** Uploads raw image bytes and returns the stored URL plus the object key needed to delete it later. */
export async function uploadImage(
  buffer: Buffer,
  filename?: string,
  folder: string = SPACES_NEWS_FOLDER,
  contentType?: string
): Promise<UploadedImage> {
  const isImage = !contentType || contentType.startsWith('image/');

  let outBuffer = buffer;
  if (isImage) {
    let pipeline = sharp(buffer)
      .rotate() // bake in EXIF orientation — phone photos are often stored sideways
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true });
    if (contentType === 'image/jpeg') pipeline = pipeline.jpeg({ quality: 82 });
    else if (contentType === 'image/webp') pipeline = pipeline.webp({ quality: 82 });
    outBuffer = await pipeline.toBuffer();
  }

  const key = `${folder}/${randomUUID()}-${sanitizeFilename(filename)}`;
  const dimensions = isImage ? imageSize(outBuffer) : { width: 0, height: 0 };

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: outBuffer,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read',
    })
  );

  return {
    url: publicUrlFor(key),
    publicId: key,
    width: dimensions.width ?? 0,
    height: dimensions.height ?? 0,
  };
}

/** Best-effort asset cleanup — a failure here must not block deleting the post itself. */
export async function deleteImage(publicId?: string | null) {
  if (!publicId || !isSpacesConfigured()) return;
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: publicId }));
  } catch (e) {
    console.error('Spaces delete failed for', publicId, e);
  }
}

export default client;
