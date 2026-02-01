import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Upload to Cloudinary and apply generative upscale
    // Note: 'upscale' is the Cloudinary AI effect that enhances image resolution
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'upscale',
      transformation: [
        { effect: 'upscale' }
      ]
    });

    if (!uploadResponse || !uploadResponse.secure_url) {
      throw new Error('Failed to get upscaled image from Cloudinary');
    }

    return NextResponse.json({ 
      success: true, 
      output: uploadResponse.secure_url,
      original: image.startsWith('http') ? image : undefined
    });

  } catch (error: any) {
    console.error('Cloudinary Upscale Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
