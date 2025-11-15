// ReadItForThePlot - Image Hashing Utility

/**
 * Generate a hash for an image URL
 * Used for caching translations
 */
async function generateImageHash(imageUrl) {
  try {
    // Simple hash based on URL and settings
    const encoder = new TextEncoder();
    const data = encoder.encode(imageUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32); // First 32 characters
  } catch (error) {
    console.error('Failed to generate image hash:', error);
    // Fallback to simple hash
    return simpleHash(imageUrl);
  }
}

/**
 * Simple hash function as fallback
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Convert image to base64 data URL
 * Needed for sending images to APIs
 */
async function imageToBase64(imageUrl, img) {
  return new Promise((resolve, reject) => {
    try {
      // If image is already a data URL, return it
      if (imageUrl.startsWith('data:')) {
        resolve(imageUrl);
        return;
      }

      // Create a canvas to convert the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size to match image
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0);

      // Convert to base64
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateImageHash, imageToBase64 };
}
