import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Upload to Cloudinary with AI upscaling transformation
    // We use eager transformation to ensure the upscaled version is generated
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'invideo-upscaler',
      eager: [
        { effect: 'upscale' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // The eager array contains the transformed versions
    const upscaledUrl = uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url;

    return NextResponse.json({ 
      success: true, 
      output: upscaledUrl,
      original: uploadResponse.secure_url
    });

  } catch (error: any) {
    console.error('Cloudinary Upscale Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
