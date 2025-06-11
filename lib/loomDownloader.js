const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileSize = async (url) => {
  try {
    const response = await axios.head(url);
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      return {
        success: true,
        data: {
          bytes: parseInt(contentLength),
          formatted: formatFileSize(parseInt(contentLength))
        }
      };
    } else {
      return { success: false, message: 'Content-Length header not found' };
    }
  } catch (error) {
    return { success: false, message: 'Error fetching file size: ' + error.message };
  }
};

const fetchLoomVideoTitle = async (videoUrl) => {
  try {
    // Use Loom's oEmbed API to get video metadata including title
    const oembedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(oembedUrl);
    
    return { 
      success: true, 
      message: 'Fetched video metadata', 
      data: {
        title: data.title,
        duration: formatDuration(data.duration),
        thumbnail_url: data.thumbnail_url,
        html: data.html,
        width: data.width,
        height: data.height
      }
    };
  } catch (error) {
    return { success: false, message: 'There are some issues while fetching loom video title.', data: null }
  }
};

const fetchLoomDownloadUrl = async (id) => {
  try {
    const { data } = await axios.post(`https://www.loom.com/api/campaigns/sessions/${id}/transcoded-url`);
    return { success: true, message: 'Fetched data', data: data.url }
  } catch (error) {
    return { success: false, message: 'There are some issues while fetching loom download URL.', data: null }
  }
};

const isLoomVideoUrl = (url) => {
  const loomDomain = 'www.loom.com';
  const trimmedUrl = url.trim();
  return trimmedUrl.startsWith('https://') && trimmedUrl.includes(loomDomain);
}

const getId = (videoUrl) => {
  const id = videoUrl.split('/').pop().split("?").shift();
  return id
}

const sanitizeFileName = (fileName) => {
  // Remove invalid characters for file names
  return fileName
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200); // Limit length to avoid issues
};

// New function to prepare video info for streaming
const prepareLoomVideo = async (videoUrl) => {
  const id = getId(videoUrl);
  
  console.log(`Processing Loom video with ID: ${id}`);
  
  // Try to fetch video metadata to get the title, but don't fail if it doesn't work
  let videoTitle = id; // Default to video ID
  
  try {
    const metadataResponse = await fetchLoomVideoTitle(videoUrl);
    
    if (metadataResponse.success && metadataResponse?.data) {
      videoTitle = sanitizeFileName(metadataResponse.data.title);
      console.log(`Successfully extracted video title: ${videoTitle}`);
      }
  } catch (error) {
    console.log(`Error extracting title, using video ID: ${error.message}`);
  }
  
  // Get the download URL
  const urlResponse = await fetchLoomDownloadUrl(id);
  if (!urlResponse.success) {
    return {
      success: false,
      message: `Failed to get download URL: ${urlResponse.message}`
    };
  }
  
  return {
    success: true,
    videoTitle,
    downloadUrl: urlResponse.data,
    videoId: id
  };
};

// Create a readable stream from Loom video URL
const createLoomVideoStream = (downloadUrl) => {
  return new Promise((resolve, reject) => {
    const request = https.get(downloadUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get video stream: ${response.statusCode}`));
        return;
      }
      
      // Add error handling for the response stream
      response.on('error', (err) => {
        console.error('Video stream error:', err.message);
      });
      
      // Add close event handling
      response.on('close', () => {
        console.log('Video stream closed');
      });
      
      resolve(response);
    });
    
    request.on('error', (err) => {
      reject(new Error(`Request error: ${err.message}`));
    });
    
    // Handle request timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// New function to get complete video details before transfer
const getLoomVideoDetails = async (videoUrl) => {
  const id = getId(videoUrl);
  
  console.log(`Getting details for Loom video with ID: ${id}`);
  
  // Get video metadata (title, duration, etc.)
  const metadataResponse = await fetchLoomVideoTitle(videoUrl);
  
  if (!metadataResponse.success) {
    return {
      success: false,
      message: `Failed to get video metadata: ${metadataResponse.message}`
    };
  }
  
  // Get the download URL
  const urlResponse = await fetchLoomDownloadUrl(id);
  if (!urlResponse.success) {
    return {
      success: false,
      message: `Failed to get download URL: ${urlResponse.message}`
    };
  }
  
  // Get file size from the download URL
  const sizeResponse = await getFileSize(urlResponse.data);
  
  return {
    success: true,
    data: {
      videoId: id,
      title: sanitizeFileName(metadataResponse.data.title),
      duration: metadataResponse.data.duration,
      thumbnailUrl: metadataResponse.data.thumbnail_url,
      downloadUrl: urlResponse.data,
      fileSize: sizeResponse.success ? sizeResponse.data : null
    }
  };
};

module.exports = {
  isLoomVideoUrl,
  prepareLoomVideo,
  createLoomVideoStream,
  getLoomVideoDetails,
  getFileSize
} 