import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
    try {
        // AppleScript command to show a folder picker
        const command = `osascript -e 'POSIX path of (choose folder with prompt "Select folder")'`;

        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.error('AppleScript Error:', stderr);
            return NextResponse.json({ error: 'Failed to open folder picker.' }, { status: 500 });
        }

        const selectedPath = stdout.trim();
        return NextResponse.json({ path: selectedPath });
    } catch (error: unknown) {
        // Check if user cancelled the dialog (AppleScript throws error on Cancel)
        if (error instanceof Error && error.message.includes('User canceled')) {
            return NextResponse.json({ cancelled: true });
        }

        console.error('Exec Error:', error);
        return NextResponse.json({ error: 'An error occurred while selecting the folder.' }, { status: 500 });
    }
}
