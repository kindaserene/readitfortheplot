// ReadItForThePlot - Content Script
console.log('ReadItForThePlot: Extension loaded!');

const MIN_IMAGE_SIZE = 50; // Minimum width/height in pixels

// Track translated images
const translatedImages = new Map(); // imageId => { canvas, translationData, isShowing }

// SVG Icons from Lucide
const ICONS = {
  pawPrint: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  `,
  loaderCircle: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rifpt-spinner">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  `,
  eye: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `,
  eyeOff: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  `,
  error: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  `
};

/**
 * Check if an image meets minimum size requirements
 */
function isImageLargeEnough(img) {
  const rect = img.getBoundingClientRect();
  return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE;
}

/**
 * Convert image to base64 data URL
 */
function imageToDataURL(img) {
  return new Promise((resolve, reject) => {
    try {
      // If already a data URL, return it
      if (img.src.startsWith('data:')) {
        resolve(img.src);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create canvas overlay for translated text
 */
function createCanvasOverlay(img, translationData) {
  const rect = img.getBoundingClientRect();

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.className = 'rifpt-canvas-overlay';
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Position canvas over image
  canvas.style.position = 'absolute';
  canvas.style.top = `${rect.top + window.scrollY}px`;
  canvas.style.left = `${rect.left + window.scrollX}px`;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none'; // Allow clicks to pass through

  // Draw translated text
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw each translated text at its bounding box location
  translationData.texts.forEach(({ text, bbox }) => {
    if (!text || !bbox) return;

    const [x, y, width, height] = bbox;

    // Calculate font size based on bbox height
    const fontSize = Math.max(12, height * 0.7);
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textBaseline = 'top';

    // Word wrap text to fit in bbox width
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > width && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw each line
    const lineHeight = fontSize * 1.2;
    lines.forEach((line, i) => {
      const yPos = y + (i * lineHeight);

      // Draw text stroke (outline)
      ctx.strokeText(line, x, yPos);
      // Draw text fill
      ctx.fillText(line, x, yPos);
    });
  });

  return canvas;
}

/**
 * Update canvas position (for scroll/resize)
 */
function updateCanvasPosition(img, canvas) {
  const rect = img.getBoundingClientRect();
  canvas.style.top = `${rect.top + window.scrollY}px`;
  canvas.style.left = `${rect.left + window.scrollX}px`;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}

/**
 * Handle translate button click
 */
async function handleTranslateClick(img, button) {
  const imageId = img.dataset.rifptButton;

  console.log('🐾 Translate button clicked!', img.src);

  // Check if translation already exists (toggle mode)
  if (translatedImages.has(imageId)) {
    toggleTranslation(img, button, imageId);
    return;
  }

  // Change to loading state
  setButtonState(button, 'loading');

  try {
    // Convert image to base64
    const imageDataUrl = await imageToDataURL(img);

    // Send to background script for translation
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_IMAGE',
      imageUrl: img.src,
      imageDataUrl: imageDataUrl
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    console.log('✅ Translation complete!', response);

    // Create canvas overlay
    const canvas = createCanvasOverlay(img, response);
    document.body.appendChild(canvas);

    // Store translation data
    translatedImages.set(imageId, {
      canvas,
      translationData: response,
      isShowing: true
    });

    // Update button to show success (eye icon)
    setButtonState(button, 'translated');

  } catch (error) {
    console.error('❌ Translation failed:', error);
    setButtonState(button, 'error');

    // Show error message
    showErrorMessage(error.message);

    // Reset to default after 3 seconds
    setTimeout(() => {
      setButtonState(button, 'default');
    }, 3000);
  }
}

/**
 * Toggle between translated and original view
 */
function toggleTranslation(img, button, imageId) {
  const data = translatedImages.get(imageId);

  if (!data) return;

  if (data.isShowing) {
    // Hide translation (show original)
    data.canvas.style.display = 'none';
    data.isShowing = false;
    setButtonState(button, 'hidden');
  } else {
    // Show translation
    data.canvas.style.display = 'block';
    data.isShowing = true;
    setButtonState(button, 'translated');
  }
}

/**
 * Set button state
 */
function setButtonState(button, state) {
  button.className = 'rifpt-translate-btn';

  switch(state) {
    case 'loading':
      button.innerHTML = ICONS.loaderCircle;
      button.classList.add('rifpt-loading');
      button.disabled = true;
      button.title = 'Translating...';
      break;

    case 'translated':
      button.innerHTML = ICONS.eye;
      button.classList.add('rifpt-success');
      button.disabled = false;
      button.title = 'Hide translation';
      break;

    case 'hidden':
      button.innerHTML = ICONS.eyeOff;
      button.classList.add('rifpt-hidden');
      button.disabled = false;
      button.title = 'Show translation';
      break;

    case 'error':
      button.innerHTML = ICONS.error;
      button.classList.add('rifpt-error');
      button.disabled = true;
      button.title = 'Translation failed';
      break;

    case 'default':
    default:
      button.innerHTML = ICONS.pawPrint;
      button.disabled = false;
      button.title = 'Translate image text';
      break;
  }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
  // Create error toast
  const toast = document.createElement('div');
  toast.className = 'rifpt-error-toast';
  toast.textContent = message;

  // Style toast
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.background = 'rgba(239, 68, 68, 0.95)';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  toast.style.zIndex = '99999';
  toast.style.maxWidth = '300px';
  toast.style.fontSize = '14px';

  document.body.appendChild(toast);

  // Remove after 5 seconds
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

/**
 * Create translate button
 */
function createTranslateButton(img) {
  if (img.dataset.rifptButton) {
    return null;
  }

  const button = document.createElement('button');
  button.className = 'rifpt-translate-btn';
  button.innerHTML = ICONS.pawPrint;
  button.title = 'Translate image text';

  const imageId = Date.now() + Math.random();
  button.dataset.imageId = imageId;
  img.dataset.rifptButton = imageId;

  button.style.position = 'absolute';
  button.style.zIndex = '10000';

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleTranslateClick(img, button);
  });

  return button;
}

/**
 * Position button next to image
 */
function positionButton(img, button) {
  const rect = img.getBoundingClientRect();
  const buttonSize = 32;
  const offset = -5;

  button.style.top = `${rect.top + window.scrollY}px`;
  button.style.left = `${rect.left + window.scrollX - buttonSize - offset}px`;
}

/**
 * Process all images on the page
 */
function processImages() {
  console.log('ReadItForThePlot: Processing images...');

  const allImages = document.querySelectorAll('img');
  const largeImages = Array.from(allImages).filter(isImageLargeEnough);

  console.log(`Found ${largeImages.length} images to process`);

  largeImages.forEach((img) => {
    if (img.dataset.rifptButton) {
      return;
    }

    const button = createTranslateButton(img);
    if (button) {
      document.body.appendChild(button);
      positionButton(img, button);
    }
  });
}

/**
 * Update button and canvas positions
 */
function updatePositions() {
  const buttons = document.querySelectorAll('.rifpt-translate-btn');
  const images = document.querySelectorAll('img[data-rifpt-button]');

  images.forEach((img) => {
    const imageId = img.dataset.rifptButton;

    // Update button position
    const button = Array.from(buttons).find(
      btn => btn.dataset.imageId === imageId
    );
    if (button) {
      positionButton(img, button);
    }

    // Update canvas position
    const data = translatedImages.get(imageId);
    if (data && data.canvas) {
      updateCanvasPosition(img, data.canvas);
    }
  });
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    console.log('Settings updated:', message.settings);

    // Reload buttons if showButtons setting changed
    if (!message.settings.showButtons) {
      document.querySelectorAll('.rifpt-translate-btn').forEach(btn => btn.remove());
    } else {
      processImages();
    }
  }
});

/**
 * Initialize extension
 */
function init() {
  console.log('ReadItForThePlot: Initializing...');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processImages);
  } else {
    processImages();
  }

  // Watch for new images
  const observer = new MutationObserver(() => {
    processImages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Update positions on scroll and resize
  let resizeTimeout;
  window.addEventListener('scroll', updatePositions);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updatePositions, 100);
  });

  console.log('ReadItForThePlot: Initialized! 🐾');
}

// Start!
init();
