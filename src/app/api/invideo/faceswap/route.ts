import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req: NextRequest) {
  try {
    const { sourceImage, targetImage } = await req.json();
    const token = process.env.PIKTID_ACCESS_TOKEN;

    if (!token) {
      throw new Error('PIKTID_ACCESS_TOKEN is missing');
    }

    if (!sourceImage || !targetImage) {
      return NextResponse.json({ error: 'Both source and target images are required' }, { status: 400 });
    }

    const client = axios.create({
      baseURL: 'https://api.piktid.com',
      headers: { Authorization: `Bearer ${token}` }
    });

    // Helper to convert base64 to buffer
    const base64ToBuffer = (base64: string) => {
      const split = base64.split(',');
      const data = split.length > 1 ? split[1] : split[0];
      return Buffer.from(data, 'base64');
    };

    // 1. Upload Target
    const targetForm = new FormData();
    targetForm.append('file', base64ToBuffer(targetImage), { filename: 'target.png', contentType: 'image/png' });
    
    console.log('Uploading target image to Piktid...');
    const targetResp = await client.post('/api/consistent_identities/upload_target', targetForm, {
      headers: targetForm.getHeaders()
    });

    const { image_id, coordinates_list } = targetResp.data;
    if (!image_id || !coordinates_list || coordinates_list.length === 0) {
      throw new Error('No faces detected in target image');
    }

    // Piktid uses FACE_ID in uppercase
    const faceId = coordinates_list[0].FACE_ID || coordinates_list[0].face_id;

    // 2. Upload Source Face
    const sourceForm = new FormData();
    sourceForm.append('file', base64ToBuffer(sourceImage), { filename: 'source.png', contentType: 'image/png' });

    console.log('Uploading source face to Piktid...');
    const sourceResp = await client.post('/api/consistent_identities/upload_face', sourceForm, {
      headers: sourceForm.getHeaders()
    });

    const { identity_name } = sourceResp.data;

    // 3. Generate Swap
    console.log('Starting face swap generation...');
    await client.post('/api/consistent_identities/generate', {
      identity_name: identity_name,
      id_image: image_id,
      id_face: faceId,
      options: {
        flag_replace_and_download: true,
        skin: true
      }
    });

    // 4. Poll for results
    console.log('Polling for results...');
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 3s = 120s max

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(r => setTimeout(r, 3000));
      
      const pollResp = await client.post('/api/consistent_identities/notification/read', {
        id_image: image_id
      });
      
      const notifications = Array.isArray(pollResp.data) ? pollResp.data : [];
      
      // Look for a completed notification for this image
      const latestNotification = notifications.find((n: any) => 
        n.status === 'completed' && (n.id_image === image_id || n.image_id === image_id)
      );

      if (latestNotification) {
        resultUrl = latestNotification.link_hd || latestNotification.link;
        // Cleanup notification
        await client.post('/api/consistent_identities/notification/delete', {
          id: latestNotification.id,
          id_image: image_id,
          f: faceId
        }).catch(() => {});
        break;
      }

      const failedNotification = notifications.find((n: any) => 
        n.status === 'failed' && (n.id_image === image_id || n.image_id === image_id)
      );
      if (failedNotification) {
        throw new Error('Face swap generation failed on Piktid');
      }
    }

    if (!resultUrl) {
      throw new Error('Face swap timed out');
    }

    return NextResponse.json({ 
      success: true, 
      output: resultUrl
    });

  } catch (error: any) {
    console.error('Piktid Face Swap Error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to swap face';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
