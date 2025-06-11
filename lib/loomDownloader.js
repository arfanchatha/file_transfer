const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

const fetchLoomVideoMetadata = async (id) => {
  try {
    console.log(`Fetching metadata for video ID: ${id}`);
    
    // Fetch the Loom share page HTML
    const response = await axios.get(`https://www.loom.com/share/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    
    // Try multiple patterns to extract the video title
    let title = null;
    
    // Pattern 1: Look for og:title meta tag
    let titleMatch = html.match(/<meta property="og:title" content="([^"]*)"[^>]*>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/\s*\|\s*Loom$/i, '').trim();
      console.log(`Found title via og:title: ${title}`);
    }
    
    // Pattern 2: Look for title tag if og:title didn't work
    if (!title) {
      titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].replace(/\s*\|\s*Loom$/i, '').trim();
        console.log(`Found title via title tag: ${title}`);
      }
    }
    
    // Pattern 3: Look for JSON-LD structured data
    if (!title) {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/is);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.name) {
            title = jsonData.name;
            console.log(`Found title via JSON-LD: ${title}`);
          }
        } catch (e) {
          console.log('Failed to parse JSON-LD data');
        }
      }
    }
    
    // Pattern 4: Look for video name in script tags
    if (!title) {
      const scriptMatch = html.match(/"name":\s*"([^"]+)"/);
      if (scriptMatch && scriptMatch[1]) {
        title = scriptMatch[1];
        console.log(`Found title via script data: ${title}`);
      }
    }
    
    if (title && title.length > 0) {
      return { 
        success: true, 
        message: 'Successfully extracted video title from HTML', 
        data: { name: title } 
      };
    }
    
    return { 
      success: false, 
      message: 'Could not extract video title from any source.', 
      data: null 
    };
    
  } catch (error) {
    console.error('Error fetching video metadata:', error.message);
    return { 
      success: false, 
      message: `Failed to fetch video page: ${error.message}`, 
      data: null 
    };
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
  
  // try {
  //   const metadataResponse = await fetchLoomVideoMetadata(id);
    
  //   if (metadataResponse.success && metadataResponse.data && metadataResponse.data.name) {
  //     videoTitle = sanitizeFileName(metadataResponse.data.name);
  //     console.log(`Successfully extracted video title: ${videoTitle}`);
  //   } else {
  //     console.log(`Could not extract video title, using video ID: ${id}`);
  //   }
  // } catch (error) {
  //   console.log(`Error extracting title, using video ID: ${error.message}`);
  // }
  
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

module.exports = {
  isLoomVideoUrl,
  prepareLoomVideo,
  createLoomVideoStream
} 