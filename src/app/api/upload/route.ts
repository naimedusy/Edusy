import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.name);
        const filename = file.name.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + ext;

        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);
        console.log(`Saved file to ${filepath}`);

        // Return the public URL
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({
            message: 'File uploaded successfully',
            url: fileUrl
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ message: 'Upload failed', error: String(error) }, { status: 500 });
    }
}
