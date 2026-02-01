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
      console.log('Target Upload Response:', JSON.stringify(targetResp.data));
      throw new Error('No faces detected in target image');
    }

    // Piktid face ID is usually the index in coordinates_list
    // The search result suggests idx_face is the parameter for the target face index
    const targetFaceIdx = coordinates_list[0].face_id !== undefined ? coordinates_list[0].face_id : 
                         (coordinates_list[0].FACE_ID !== undefined ? coordinates_list[0].FACE_ID : 0);

    // 2. Upload Source Face
    const sourceForm = new FormData();
    sourceForm.append('file', base64ToBuffer(sourceImage), { filename: 'source.png', contentType: 'image/png' });

    console.log('Uploading source face to Piktid...');
    const sourceResp = await client.post('/api/consistent_identities/upload_face', sourceForm, {
      headers: sourceForm.getHeaders()
    });

    const identity_name = sourceResp.data.face_name || sourceResp.data.identity_name;
    if (!identity_name) {
      console.log('Source Upload Response:', JSON.stringify(sourceResp.data));
      throw new Error('Failed to get identity name from source image');
    }

    // 3. Generate Swap
    console.log('Starting face swap generation...');
    const genResp = await client.post('/api/consistent_identities/generate', {
      id_image: image_id,
      id_face: identity_name,
      idx_face: targetFaceIdx,
      flag_replace_and_download: true,
      skin: true
    });

    const job_id = genResp.data.job_id;
    console.log('Generation started, job_id:', job_id);

    // 4. Poll for results
    console.log('Polling for results...');
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 40; // 40 * 3s = 120s max

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(r => setTimeout(r, 3000));
      
      // Try polling by job_id first if available, otherwise fallback to id_image
      let pollResp;
      if (job_id) {
        pollResp = await client.get(`/api/consistent_identities/notification/read?job_id=${job_id}`);
      } else {
        pollResp = await client.post('/api/consistent_identities/notification/read', {
          id_image: image_id
        });
      }
      
      const data = pollResp.data;
      console.log(`Poll attempt ${attempts} status:`, data.status || 'unknown');

      if (data.status === 'completed' || data.status === 'complete') {
        resultUrl = data.link_hd || data.link;
        break;
      }

      if (data.status === 'failed' || data.status === 'error') {
        throw new Error('Face swap generation failed on Piktid');
      }

      // If it's an array (old behavior or fallback)
      if (Array.isArray(data)) {
        const latestNotification = data.find((n: any) => 
          (n.status === 'completed' || n.status === 'complete') && 
          (n.id_image === image_id || n.image_id === image_id || n.job_id === job_id)
        );

        if (latestNotification) {
          resultUrl = latestNotification.link_hd || latestNotification.link;
          break;
        }

        const failedNotification = data.find((n: any) => 
          (n.status === 'failed' || n.status === 'error') && 
          (n.id_image === image_id || n.image_id === image_id || n.job_id === job_id)
        );
        if (failedNotification) {
          throw new Error('Face swap generation failed on Piktid');
        }
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
