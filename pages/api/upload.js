// pages/api/upload.js
// ================================================
// IMAGE UPLOAD API — Uses imgbb for free hosting
// ================================================
// 
// SETUP:
// 1. Go to https://api.imgbb.com/ and sign up (free)
// 2. Get your API key from the dashboard
// 3. Add to your .env.local file:
//    IMGBB_API_KEY=your_api_key_here
//
// This endpoint receives an image file, uploads it to imgbb,
// and returns a public URL that YCloud can use for WhatsApp messages.
// ================================================

import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parser so formidable can handle multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error('IMGBB_API_KEY not configured');
    return res.status(500).json({ error: 'Image upload service not configured' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB max (WhatsApp limit)
      allowEmptyFiles: false,
    });

    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' });
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(file.filepath);
    const base64Image = fileBuffer.toString('base64');

    // Upload to imgbb
    const imgbbForm = new FormData();
    imgbbForm.append('key', apiKey);
    imgbbForm.append('image', base64Image);
    imgbbForm.append('name', file.originalFilename || `promo-${Date.now()}`);

    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbForm,
    });

    const imgbbData = await imgbbResponse.json();

    if (!imgbbData.success) {
      console.error('imgbb upload failed:', imgbbData);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Return the public URL
    return res.status(200).json({
      success: true,
      url: imgbbData.data.url,
      display_url: imgbbData.data.display_url,
      thumbnail: imgbbData.data.thumb?.url || null,
      delete_url: imgbbData.data.delete_url,
      size: imgbbData.data.size,
    });
  } catch (error) {
    console.error('Upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE' || error.httpCode === 413) {
      return res.status(413).json({ error: 'File too large. Max 5MB allowed.' });
    }

    return res.status(500).json({ error: 'Error uploading file' });
  }
}
