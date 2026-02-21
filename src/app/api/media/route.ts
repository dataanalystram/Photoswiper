import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
        return new NextResponse('Missing path parameter', { status: 400 });
    }

    try {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const stat = fs.statSync(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase();

        const contentTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.heic': 'image/heic',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm'
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        // Helper to stream file to Web ReadableStream
        const streamFile = (start?: number, end?: number) => {
            const readStream = fs.createReadStream(absolutePath, { start, end });
            return new ReadableStream({
                start(controller) {
                    readStream.on('data', (chunk) => controller.enqueue(chunk));
                    readStream.on('end', () => controller.close());
                    readStream.on('error', (err) => controller.error(err));
                },
                cancel() {
                    readStream.destroy();
                },
            });
        };

        // Handle Range Requests for videos
        const range = request.headers.get('range');
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
            const chunksize = (end - start) + 1;

            const stream = streamFile(start, end);
            return new NextResponse(stream, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': contentType,
                },
            });
        }

        // Default stream for full content (like images)
        const stream = streamFile();
        return new NextResponse(stream, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stat.size.toString(),
            },
        });

    } catch {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
