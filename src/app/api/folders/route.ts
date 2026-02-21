import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MEDIA_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic',
    '.mp4', '.mov', '.avi', '.mkv', '.webm'
]);

export async function POST(request: Request) {
    try {
        const { source, target } = await request.json();

        if (!source || !target) {
            return NextResponse.json({ error: 'Source and target folders are required.' }, { status: 400 });
        }

        if (!fs.existsSync(source)) {
            return NextResponse.json({ error: 'Source directory does not exist or is not fully accessible.' }, { status: 400 });
        }

        // Create target if it doesn't exist
        if (!fs.existsSync(target)) {
            try {
                fs.mkdirSync(target, { recursive: true });
            } catch {
                return NextResponse.json({ error: 'Failed to create target directory check permissions.' }, { status: 400 });
            }
        }

        // Read all files in source directory
        // withFileTypes is much faster than statSync on every file
        let items;
        try {
            items = fs.readdirSync(source, { withFileTypes: true });
        } catch {
            return NextResponse.json({ error: 'Failed to read source directory.' }, { status: 400 });
        }

        // Filter for media files (images and videos) natively
        const mediaFiles = items
            .filter(item => item.isFile() && MEDIA_EXTENSIONS.has(path.extname(item.name).toLowerCase()))
            .map(item => item.name);

        // we sort them alphabetically so they are consistently ordered
        mediaFiles.sort((a, b) => a.localeCompare(b));

        return NextResponse.json({
            success: true,
            totalFiles: mediaFiles.length,
            files: mediaFiles
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred server-side';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
