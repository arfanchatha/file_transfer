const { isLoomVideoUrl, getLoomVideoDetails } = require('../../lib/loomDownloader');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { loomUrl } = req.body;

  if (!loomUrl) {
    return res.status(400).json({ success: false, message: 'Loom URL is required' });
  }

  if (!isLoomVideoUrl(loomUrl)) {
    return res.status(400).json({ success: false, message: 'Invalid Loom URL' });
  }

  try {
    console.log('Getting video details for:', loomUrl);
    
    const videoDetails = await getLoomVideoDetails(loomUrl);
    
    if (!videoDetails.success) {
      return res.status(500).json({ 
        success: false, 
        message: videoDetails.message || 'Failed to get video details' 
      });
    }

    console.log('Video details retrieved successfully:', videoDetails.data.title);
    
    res.json({ 
      success: true, 
      data: videoDetails.data
    });
    
  } catch (err) {
    console.error('Error getting video details:', err.message);
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to get video details'
    });
  }
} 