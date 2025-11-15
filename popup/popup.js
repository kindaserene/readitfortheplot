// ReadItForThePlot - Popup Script

// Default settings
const DEFAULT_SETTINGS = {
  deepseekKey: '',
  geminiKey: '',
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  enableCache: true,
  showButtons: true
};

// DOM elements
const elements = {
  deepseekKey: document.getElementById('deepseekKey'),
  geminiKey: document.getElementById('geminiKey'),
  sourceLanguage: document.getElementById('sourceLanguage'),
  targetLanguage: document.getElementById('targetLanguage'),
  enableCache: document.getElementById('enableCache'),
  showButtons: document.getElementById('showButtons'),
  saveBtn: document.getElementById('saveBtn'),
  clearCacheBtn: document.getElementById('clearCacheBtn'),
  statusMessage: document.getElementById('statusMessage')
};

/**
 * Load settings from chrome.storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    // Populate form fields
    elements.deepseekKey.value = settings.deepseekKey || '';
    elements.geminiKey.value = settings.geminiKey || '';
    elements.sourceLanguage.value = settings.sourceLanguage || 'auto';
    elements.targetLanguage.value = settings.targetLanguage || 'en';
    elements.enableCache.checked = settings.enableCache !== false;
    elements.showButtons.checked = settings.showButtons !== false;

    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

/**
 * Save settings to chrome.storage
 */
async function saveSettings() {
  try {
    const settings = {
      deepseekKey: elements.deepseekKey.value.trim(),
      geminiKey: elements.geminiKey.value.trim(),
      sourceLanguage: elements.sourceLanguage.value,
      targetLanguage: elements.targetLanguage.value,
      enableCache: elements.enableCache.checked,
      showButtons: elements.showButtons.checked
    };

    // Validate API keys
    if (!settings.deepseekKey || !settings.geminiKey) {
      showStatus('Please enter both API keys', 'error');
      return;
    }

    // Save to storage
    await chrome.storage.sync.set(settings);

    console.log('Settings saved:', settings);
    showStatus('Settings saved successfully!', 'success');

    // Notify content scripts of settings change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings
        }).catch(() => {
          // Ignore errors for tabs where content script isn't injected
        });
      });
    });

  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Clear translation cache
 */
async function clearCache() {
  try {
    await chrome.storage.local.remove('translationCache');
    console.log('Cache cleared');
    showStatus('Cache cleared successfully!', 'success');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    showStatus('Failed to clear cache', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    elements.statusMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Initialize popup
 */
function init() {
  console.log('Popup initialized');

  // Load saved settings
  loadSettings();

  // Event listeners
  elements.saveBtn.addEventListener('click', saveSettings);
  elements.clearCacheBtn.addEventListener('click', clearCache);

  // Save on Enter key in input fields
  [elements.deepseekKey, elements.geminiKey].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveSettings();
      }
    });
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
