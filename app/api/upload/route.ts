import { NextResponse } from 'next/server';
import {
  uploadImage,
  isSpacesConfigured,
  SPACES_NEWS_FOLDER,
  SPACES_MEMBERS_FOLDER,
  SPACES_GALLERY_FOLDER,
} from '@/lib/spaces';
import { isStaffRequest } from '@/lib/auth-guard';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
// Staff-authenticated, so the set of destination folders is deliberately fixed
// rather than accepting an arbitrary string from the client.
const FOLDERS: Record<string, string> = {
  news: SPACES_NEWS_FOLDER,
  members: SPACES_MEMBERS_FOLDER,
  gallery: SPACES_GALLERY_FOLDER,
};

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSpacesConfigured()) {
      return NextResponse.json(
        {
          error:
            'Image uploads are not configured. Set DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_BUCKET, DO_SPACES_KEY and DO_SPACES_SECRET.',
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
    const uploaded = await uploadImage(buffer, file.name, folder, file.type);

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error: any) {
    console.error('Upload failed', error);
    return NextResponse.json({ error: error.message ?? 'Upload failed' }, { status: 500 });
  }
}
