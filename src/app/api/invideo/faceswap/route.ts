import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { sourceImage, targetImage } = await req.json();

    if (!sourceImage || !targetImage) {
      return NextResponse.json({ error: 'Both source and target images are required' }, { status: 400 });
    }

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken) {
      return NextResponse.json({ error: 'Apify API token not configured' }, { status: 500 });
    }

    // Helper function to upload base64 to Cloudinary and get URL
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

    // Upload images to Cloudinary to get HTTPS URLs for Apify
    const [sourceUrl, targetUrl] = await Promise.all([
      uploadToCloudinary(sourceImage),
      uploadToCloudinary(targetImage)
    ]);

    const client = new ApifyClient({
      token: apifyToken,
    });

    // Run the Apify actor synchronously
    const run = await client.actor('akash9078/ai-face-swap').call({
      sourceUrl,
      targetUrl,
      outputFormat: 'PNG',
    });

    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Apify actor failed with status: ${run.status}`);
    }

    // Get the results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0 || !items[0].imageUrl) {
      throw new Error('Failed to get output from Apify');
    }

    return NextResponse.json({ 
      success: true, 
      output: items[0].imageUrl
    });

  } catch (error: any) {
    console.error('Apify Face Swap Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to swap face' },
      { status: 500 }
    );
  }
}
