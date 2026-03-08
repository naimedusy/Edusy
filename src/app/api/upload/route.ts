import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
            folder: 'edusy_uploads',
            resource_type: 'auto',
        });

        console.log(`Uploaded file to Cloudinary: ${uploadResponse.secure_url}`);

        return NextResponse.json({
            message: 'File uploaded successfully',
            url: uploadResponse.secure_url
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({
            message: 'Upload failed',
            error: String(error)
        }, { status: 500 });
    }
}
