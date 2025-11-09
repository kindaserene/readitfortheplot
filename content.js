// ReadItForThePlot - Content Script
console.log('ReadItForThePlot: Extension loaded!');

const MIN_IMAGE_SIZE = 50; // Minimum width/height in pixels

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
  const width = rect.width;
  const height = rect.height;
  return width >= MIN_IMAGE_SIZE && height >= MIN_IMAGE_SIZE;
}

/**
 * Create translate button with paw print icon
 */
function createTranslateButton(img) {
  // Check if button already exists for this image
  if (img.dataset.rifptButton) {
    return null;
  }

  const button = document.createElement('button');
  button.className = 'rifpt-translate-btn';
  button.innerHTML = ICONS.pawPrint;
  button.title = 'Translate image text';
  
  // Store reference to the image
  button.dataset.imageId = img.dataset.rifptButton = Date.now() + Math.random();
  
  // Position button
  button.style.position = 'absolute';
  button.style.zIndex = '10000';
  
  // Click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleTranslateClick(img, button);
  });

  return button;
}

/**
 * Handle translate button click
 */
async function handleTranslateClick(img, button) {
  console.log('🐾 Translate button clicked!', img.src);
  
  // Change to loading state
  setButtonState(button, 'loading');
  
  // Simulate translation process (will be real API call later)
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success
    console.log('✅ Translation complete!');
    setButtonState(button, 'success');
    
  } catch (error) {
    console.error('❌ Translation failed:', error);
    setButtonState(button, 'error');
    
    // Reset to default after 2 seconds
    setTimeout(() => {
      setButtonState(button, 'default');
    }, 2000);
  }
}

/**
 * Set button state (default, loading, success, error)
 */
function setButtonState(button, state) {
  button.className = 'rifpt-translate-btn'; // Reset classes
  
  switch(state) {
    case 'loading':
      button.innerHTML = ICONS.loaderCircle;
      button.classList.add('rifpt-loading');
      button.disabled = true;
      button.title = 'Translating...';
      break;
      
    case 'success':
      button.innerHTML = ICONS.eye;
      button.classList.add('rifpt-success');
      button.disabled = false;
      button.title = 'Show original';
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
 * Position button next to image (left side, top aligned)
 */
function positionButton(img, button) {
  const rect = img.getBoundingClientRect();
  
  // Button size
  const buttonSize = 32; // Button is 32x32px
  const offset = -5; // Space between button and image
  
  // Position: left side, aligned with top of image
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
  
  largeImages.forEach((img, index) => {
    // Skip if already processed
    if (img.dataset.rifptButton) {
      return;
    }

    // Create button
    const button = createTranslateButton(img);
    if (button) {
      // Add button to page
      document.body.appendChild(button);
      
      // Position it
      positionButton(img, button);
      
      console.log(`✅ Added button to image ${index + 1}`);
    }
  });
}

/**
 * Update button positions on scroll/resize
 */
function updateButtonPositions() {
  const buttons = document.querySelectorAll('.rifpt-translate-btn');
  const images = document.querySelectorAll('img[data-rifpt-button]');
  
  images.forEach((img) => {
    const button = Array.from(buttons).find(
      btn => btn.dataset.imageId === img.dataset.rifptButton
    );
    if (button) {
      positionButton(img, button);
    }
  });
}

/**
 * Initialize extension
 */
function init() {
  console.log('ReadItForThePlot: Initializing...');
  
  // Process images when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processImages);
  } else {
    processImages();
  }
  
  // Watch for new images (dynamic content)
  const observer = new MutationObserver(() => {
    processImages();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Update positions on scroll and resize
  window.addEventListener('scroll', updateButtonPositions);
  window.addEventListener('resize', updateButtonPositions);
  
  console.log('ReadItForThePlot: Initialized! 🐾');
}

// Start!
init();