const { google } = require('googleapis');
const { promisify } = require('util');
const stream = require('stream');
const { isLoomVideoUrl, prepareLoomVideo, createLoomVideoStream } = require('../../lib/loomDownloader');

const pipeline = promisify(stream.pipeline);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { loomUrl, accessToken, fileName, folderId } = req.body;

  if (!isLoomVideoUrl(loomUrl)) {
    return res.status(400).json({ success: false, message: 'Invalid Loom URL' });
  }

  // Check if request was already aborted
  if (req.aborted) {
    console.log('Request was already aborted');
    return res.status(499).json({ success: false, message: 'Request aborted' });
  }

  let videoStream = null;

  try {
    console.log('Preparing Loom video for streaming...');
    
    // Check for abortion before each major step
    if (req.aborted) {
      throw new Error('Request aborted during preparation');
    }
    
    // Get video metadata and download URL
    const videoInfo = await prepareLoomVideo(loomUrl);
    
    if (!videoInfo.success) {
      return res.status(500).json({ 
        success: false, 
        message: videoInfo.message || 'Failed to prepare Loom video' 
      });
    }

    if (req.aborted) {
      throw new Error('Request aborted after video preparation');
    }

    console.log(`Video title: ${videoInfo.videoTitle}`);
    console.log('Creating video stream...');
    
    // Create readable stream from Loom
    videoStream = await createLoomVideoStream(videoInfo.downloadUrl);
    
    // Handle stream cleanup on request abort
    req.on('close', () => {
      console.log('Request closed, cleaning up stream...');
      if (videoStream && !videoStream.destroyed) {
        videoStream.destroy();
      }
    });

    req.on('aborted', () => {
      console.log('Request aborted, cleaning up stream...');
      if (videoStream && !videoStream.destroyed) {
        videoStream.destroy();
      }
    });

    if (req.aborted) {
      throw new Error('Request aborted during stream creation');
    }
    
    console.log('Setting up Google Drive upload...');
    
    // Setup Google Drive API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const metadata = {
      name: fileName || `${videoInfo.videoTitle}.mp4`,
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: 'video/mp4',
      body: videoStream,
    };

    if (req.aborted) {
      throw new Error('Request aborted before upload');
    }

    console.log('Starting direct upload to Google Drive...');
    
    // Create a promise that rejects if the request is aborted
    const uploadPromise = drive.files.create({
      requestBody: metadata,
      media,
      fields: 'id,name,size',
    });
    
    const abortPromise = new Promise((_, reject) => {
      const checkAbort = () => {
        if (req.aborted) {
          reject(new Error('Request aborted during upload'));
        } else {
          setTimeout(checkAbort, 100); // Check every 100ms
        }
      };
      checkAbort();
    });
    
    // Race between upload and abort check
    const driveRes = await Promise.race([uploadPromise, abortPromise]);

    console.log('Upload completed successfully!');
    
    res.json({ 
      success: true, 
      fileId: driveRes.data.id, 
      fileName: driveRes.data.name,
      fileSize: driveRes.data.size,
      videoTitle: videoInfo.videoTitle,
      message: 'Video successfully streamed to Google Drive without local storage'
    });
    
  } catch (err) {
    console.error('Streaming upload failed:', err.message);
    
    // Clean up stream if it exists
    if (videoStream && !videoStream.destroyed) {
      videoStream.destroy();
    }
    
    // Handle different types of errors
    if (req.aborted || err.message.includes('Request aborted') || err.code === 'ECONNABORTED' || err.message.includes('aborted') || err.message.includes('cancelled')) {
      console.log('Transfer was cancelled/aborted');
      return res.status(499).json({ 
        success: false, 
        message: 'Transfer was cancelled',
        error: 'Request aborted by user'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to stream video to Google Drive',
      error: err.message 
    });
  }
} 