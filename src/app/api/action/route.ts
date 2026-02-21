import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { sourcePath, targetDir, action } = await request.json();

        if (!sourcePath || !targetDir || !action) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        if (!fs.existsSync(sourcePath)) {
            return NextResponse.json({ error: 'Source file does not exist.' }, { status: 404 });
        }

        if (!fs.existsSync(targetDir)) {
            return NextResponse.json({ error: 'Target directory does not exist.' }, { status: 404 });
        }

        const fileName = path.basename(sourcePath);
        const targetPath = path.join(targetDir, fileName);

        if (action === 'copy') {
            // Swipe Right (Up) -> Copy file
            // Prevent duplicates: skip if already exists
            if (fs.existsSync(targetPath)) {
                return NextResponse.json({ success: true, message: 'File already exists in target. Skipping copy.' });
            }
            fs.copyFileSync(sourcePath, targetPath);
            return NextResponse.json({ success: true, message: 'File copied successfully.' });
        } else if (action === 'undo') {
            // Undo a previous right swipe -> Remove copied file if it exists
            if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
            }
            return NextResponse.json({ success: true, message: 'Undo successful. File removed.' });
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An error occurred during file action.';
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
