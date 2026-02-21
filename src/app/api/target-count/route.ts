import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEDIA_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
    '.mp4', '.mov', '.avi', '.mkv', '.webm'
]);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetDir = searchParams.get('dir');

    if (!targetDir) {
        return NextResponse.json({ error: 'Missing dir parameter' }, { status: 400 });
    }

    try {
        if (!fs.existsSync(targetDir)) {
            return NextResponse.json({ count: 0 });
        }

        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const mediaFiles = entries.filter(item =>
            item.isFile() && MEDIA_EXTENSIONS.has(path.extname(item.name).toLowerCase())
        ).map(item => item.name);

        return NextResponse.json({
            count: mediaFiles.length,
            files: mediaFiles
        });
    } catch {
        return NextResponse.json({ error: 'Failed to count files' }, { status: 500 });
    }
}
