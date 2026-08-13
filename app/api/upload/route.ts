import { NextResponse } from 'next/server';
import { uploadImage, isCloudinaryConfigured, CLOUDINARY_FOLDER, CLOUDINARY_MEMBERS_FOLDER } from '@/lib/cloudinary';
import { isStaffRequest } from '@/lib/auth-guard';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
// Staff-authenticated, so the set of destination folders is deliberately fixed
// rather than accepting an arbitrary string from the client.
const FOLDERS: Record<string, string> = { news: CLOUDINARY_FOLDER, members: CLOUDINARY_MEMBERS_FOLDER };

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type || 'unknown'}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image is larger than 8MB' }, { status: 413 });
    }

    const folderKey = formData.get('folder');
    const folder = typeof folderKey === 'string' ? FOLDERS[folderKey] : undefined;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImage(buffer, file.name, folder);

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error: any) {
    console.error('Upload failed', error);
    return NextResponse.json({ error: error.message ?? 'Upload failed' }, { status: 500 });
  }
}
