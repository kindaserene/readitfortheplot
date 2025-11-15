// ReadItForThePlot - Storage Utility

/**
 * Storage utility for managing settings and cache
 */
const Storage = {
  /**
   * Get settings from chrome.storage.sync
   */
  async getSettings() {
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
  },

  /**
   * Save settings to chrome.storage.sync
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },

  /**
   * Get translation from cache
   * @param {string} imageHash - Hash of the image
   * @returns {Promise<object|null>} Cached translation or null
   */
  async getCachedTranslation(imageHash) {
    try {
      const result = await chrome.storage.local.get('translationCache');
      const cache = result.translationCache || {};

      if (cache[imageHash]) {
        const cached = cache[imageHash];
        // Check if cache is still valid (7 days)
        const cacheAge = Date.now() - cached.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (cacheAge < maxAge) {
          console.log('Cache hit for:', imageHash);
          return cached.data;
        } else {
          console.log('Cache expired for:', imageHash);
          // Remove expired entry
          delete cache[imageHash];
          await chrome.storage.local.set({ translationCache: cache });
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached translation:', error);
      return null;
    }
  },

  /**
   * Save translation to cache
   * @param {string} imageHash - Hash of the image
   * @param {object} translationData - Translation data to cache
   */
  async cacheTranslation(imageHash, translationData) {
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
        // Remove oldest entries
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toKeep = entries.slice(-100);
        const newCache = Object.fromEntries(toKeep);
        await chrome.storage.local.set({ translationCache: newCache });
      } else {
        await chrome.storage.local.set({ translationCache: cache });
      }

      console.log('Translation cached for:', imageHash);
    } catch (error) {
      console.error('Failed to cache translation:', error);
    }
  },

  /**
   * Clear all cached translations
   */
  async clearCache() {
    try {
      await chrome.storage.local.remove('translationCache');
      console.log('Cache cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  },

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const result = await chrome.storage.local.get('translationCache');
      const cache = result.translationCache || {};
      const entries = Object.keys(cache).length;

      // Calculate total size (approximate)
      const sizeBytes = new Blob([JSON.stringify(cache)]).size;
      const sizeKB = (sizeBytes / 1024).toFixed(2);

      return {
        entries,
        sizeKB
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { entries: 0, sizeKB: '0' };
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
