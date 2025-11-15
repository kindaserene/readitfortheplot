// ReadItForThePlot - Background Script
console.log('ReadItForThePlot: Background script loaded!');

// API Endpoints
const API = {
  DEEPSEEK_OCR: 'https://api.deepseek.com/v1/chat/completions',
  GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
};

/**
 * Call DeepSeek OCR API to extract text from image
 */
async function extractTextFromImage(imageDataUrl, apiKey) {
  try {
    console.log('Calling DeepSeek OCR API...');

    const response = await fetch(API.DEEPSEEK_OCR, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              },
              {
                type: 'text',
                text: 'Extract all text from this image. Return the text with bounding box coordinates in JSON format: {"texts": [{"text": "...", "bbox": [x, y, width, height]}]}. If no text is found, return {"texts": []}.'
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from DeepSeek API');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in response, returning raw text');
      return {
        texts: [{
          text: content.trim(),
          bbox: [0, 0, 100, 100] // Default bbox
        }]
      };
    }

    const ocrResult = JSON.parse(jsonMatch[0]);
    console.log('OCR extracted:', ocrResult);

    return ocrResult;
  } catch (error) {
    console.error('DeepSeek OCR error:', error);
    throw error;
  }
}

/**
 * Call Gemini API to translate text
 */
async function translateText(texts, sourceLanguage, targetLanguage, apiKey) {
  try {
    console.log('Calling Gemini Translation API...');

    // Combine all texts for translation
    const combinedText = texts.map((t, i) => `[${i}] ${t.text}`).join('\n');

    const prompt = `Translate the following text from ${sourceLanguage === 'auto' ? 'detected language' : sourceLanguage} to ${targetLanguage}. Preserve the [number] prefixes in your translation:\n\n${combinedText}`;

    const response = await fetch(`${API.GEMINI_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!translatedText) {
      throw new Error('No translation returned from Gemini API');
    }

    console.log('Translation result:', translatedText);

    // Parse the translated texts back
    const translatedTexts = texts.map((original, index) => {
      const regex = new RegExp(`\\[${index}\\]\\s*([^\\[]*?)(?=\\n\\[|$)`, 's');
      const match = translatedText.match(regex);
      return {
        text: match ? match[1].trim() : original.text,
        bbox: original.bbox
      };
    });

    return translatedTexts;
  } catch (error) {
    console.error('Gemini Translation error:', error);
    throw error;
  }
}

/**
 * Main translation pipeline
 */
async function translateImage(imageDataUrl, settings, imageHash) {
  try {
    console.log('Starting translation pipeline...');

    // Check cache first if enabled
    if (settings.enableCache) {
      const cached = await getCachedTranslation(imageHash);
      if (cached) {
        console.log('Using cached translation');
        return cached;
      }
    }

    // Step 1: Extract text using DeepSeek OCR
    const ocrResult = await extractTextFromImage(imageDataUrl, settings.deepseekKey);

    if (!ocrResult.texts || ocrResult.texts.length === 0) {
      return {
        success: false,
        error: 'No text found in image'
      };
    }

    // Step 2: Translate text using Gemini
    const translatedTexts = await translateText(
      ocrResult.texts,
      settings.sourceLanguage,
      settings.targetLanguage,
      settings.geminiKey
    );

    const result = {
      success: true,
      texts: translatedTexts,
      originalTexts: ocrResult.texts
    };

    // Cache the result if enabled
    if (settings.enableCache) {
      await cacheTranslation(imageHash, result);
    }

    return result;
  } catch (error) {
    console.error('Translation pipeline error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get cached translation
 */
async function getCachedTranslation(imageHash) {
  try {
    const result = await chrome.storage.local.get('translationCache');
    const cache = result.translationCache || {};

    if (cache[imageHash]) {
      const cached = cache[imageHash];
      const cacheAge = Date.now() - cached.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (cacheAge < maxAge) {
        return cached.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get cached translation:', error);
    return null;
  }
}

/**
 * Cache translation
 */
async function cacheTranslation(imageHash, translationData) {
  try {
    const result = await chrome.storage.local.get('translationCache');
    const cache = result.translationCache || {};

    cache[imageHash] = {
      timestamp: Date.now(),
      data: translationData
    };

    // Limit cache size to 100 entries
    const entries = Object.entries(cache);
    if (entries.length > 100) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = entries.slice(-100);
      const newCache = Object.fromEntries(toKeep);
      await chrome.storage.local.set({ translationCache: newCache });
    } else {
      await chrome.storage.local.set({ translationCache: cache });
    }
  } catch (error) {
    console.error('Failed to cache translation:', error);
  }
}

/**
 * Generate simple hash for image URL
 */
function generateImageHash(imageUrl) {
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    const char = imageUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get settings from storage
 */
async function getSettings() {
  const defaults = {
    deepseekKey: '',
    geminiKey: '',
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    enableCache: true,
    showButtons: true
  };

  try {
    const settings = await chrome.storage.sync.get(defaults);
    return settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    return defaults;
  }
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  if (message.type === 'TRANSLATE_IMAGE') {
    // Handle translation request
    (async () => {
      try {
        const settings = await getSettings();

        // Validate API keys
        if (!settings.deepseekKey || !settings.geminiKey) {
          sendResponse({
            success: false,
            error: 'API keys not configured. Please set them in the extension popup.'
          });
          return;
        }

        const imageHash = generateImageHash(message.imageUrl);
        const result = await translateImage(message.imageDataUrl, settings, imageHash);

        sendResponse(result);
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    })();

    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_SETTINGS') {
    // Return current settings
    (async () => {
      const settings = await getSettings();
      sendResponse(settings);
    })();

    return true;
  }
});

/**
 * Extension installed/updated handler
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('ReadItForThePlot: Extension installed/updated!');
});
