import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { sourceImage, targetImage } = await req.json();

    if (!sourceImage || !targetImage) {
      return NextResponse.json({ error: 'Both source and target images are required' }, { status: 400 });
    }

    // Helper function to upload base64 to Cloudinary and get URL
    // Gradio client can take URLs directly
    const uploadToCloudinary = async (base64: string) => {
      try {
        const uploadResponse = await cloudinary.uploader.upload(base64, {
          folder: 'faceswap',
        });
        return uploadResponse.secure_url;
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to process image for swapping');
      }
    };

    // Upload images to Cloudinary to get HTTPS URLs
    const [sourceUrl, targetUrl] = await Promise.all([
      uploadToCloudinary(sourceImage),
      uploadToCloudinary(targetImage)
    ]);

    // Connect to a free Hugging Face Space
    // "Dentro/face-swap" is a popular and stable one
    const client = await Client.connect("Dentro/face-swap");
    
    // Call the prediction
    // Note: The input parameters depend on the specific space's API
    // Most face swap spaces take (source_img, target_img)
    const result: any = await client.predict("/predict", {
      sourceImage: sourceUrl,
      targetImage: targetUrl,
    });

    if (!result || !result.data || !result.data[0]) {
      // Try another endpoint or format if the first one fails
      throw new Error('Failed to get output from Hugging Face Space');
    }

    // Result data[0] is usually the image object or URL
    const outputImage = result.data[0].url || result.data[0];

    return NextResponse.json({ 
      success: true, 
      output: outputImage
    });

  } catch (error: any) {
    console.error('Hugging Face Face Swap Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to swap face' },
      { status: 500 }
    );
  }
}
