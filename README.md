# ReadItForThePlot 🐾

A browser extension that translates text within images directly on any webpage using AI-powered OCR and translation.

## Features

- **In-place Translation**: Translate image text with a single click
- **Canvas Overlay**: Translated text appears naturally over the original image
- **Toggle View**: Switch between translated and original text
- **Smart Caching**: Avoid re-processing the same images
- **Multi-language Support**: Translate between 15+ languages
- **Privacy-Focused**: User-provided API keys, no data collection

## How It Works

1. Click the paw print button next to any image
2. DeepSeek OCR extracts text from the image
3. Gemini translates the text to your target language
4. Canvas overlay displays translated text in-place
5. Click the eye icon to toggle between translated/original

## Installation

### Prerequisites

You'll need API keys for:
1. **DeepSeek API** (for OCR): [Get key](https://platform.deepseek.com/api_keys)
2. **Google Gemini API** (for translation): [Get key](https://makersuite.google.com/app/apikey)

Both services offer free tiers for development and testing.

### Chrome/Edge Installation

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `readitfortheplot` directory
6. The extension icon should appear in your toolbar

### Firefox Installation

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `readitfortheplot` directory
5. Select the `manifest.json` file
6. The extension should now be loaded

> **Note**: In Firefox, temporary extensions are removed when you close the browser. For permanent installation, you need to package and sign the extension.

## Setup

1. Click the extension icon to open settings
2. Enter your **DeepSeek API key**
3. Enter your **Gemini API key**
4. Select your **source language** (language in images)
5. Select your **target language** (translate to)
6. Click **Save Settings**

## Usage

### Translating Images

1. Navigate to any webpage with images
2. Look for the paw print 🐾 button next to images
3. Click the button to translate
4. Wait for the loading indicator (yellow)
5. Translated text appears overlaid on the image
6. Button turns green with an eye icon

### Toggle Translation

- **Green eye icon**: Click to hide translation (show original)
- **Gray eye-off icon**: Click to show translation again

### Settings

- **Enable Cache**: Store translations locally for faster repeat visits
- **Show Buttons**: Toggle visibility of paw print buttons
- **Clear Cache**: Remove all cached translations

## Technical Details

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Content   │─────▶│  Background  │─────▶│  DeepSeek  │
│   Script    │      │    Script    │      │  OCR API   │
│             │◀─────│              │      └────────────┘
│  - Buttons  │      │  - API Calls │
│  - Canvas   │      │  - Caching   │      ┌────────────┐
│  - UI       │      │  - Storage   │─────▶│   Gemini   │
└─────────────┘      └──────────────┘      │Translation │
                                            │    API     │
                                            └────────────┘
```

### Key Components

- **manifest.json**: Extension configuration (Manifest V3)
- **content.js**: Injects buttons, handles canvas overlays, manages UI
- **background.js**: API integration, caching, message handling
- **popup/**: Settings UI for API keys and preferences
- **utils/**: Storage and image hashing utilities
- **styles/**: CSS for buttons and overlays

### Canvas Overlay Method

Instead of editing image pixels or using HTML overlays, this extension:
1. Creates a transparent `<canvas>` element
2. Positions it absolutely over the original image
3. Draws translated text on the canvas
4. Preserves original image integrity
5. Handles responsive layouts and scrolling

## API Usage & Costs

### DeepSeek OCR

- **Free Tier**: Available with rate limits
- **Cost**: Varies by usage ([pricing](https://platform.deepseek.com/pricing))
- **Format**: Vision model processes images and returns text with coordinates

### Gemini Translation

- **Free Tier**: 60 requests/minute, 1500 requests/day
- **Cost**: Free for most personal use ([pricing](https://ai.google.dev/pricing))
- **Format**: Text-to-text translation with language detection

## Privacy & Security

- All API keys are stored locally in your browser
- No data is sent to any servers except DeepSeek and Gemini
- Translations can be cached locally to minimize API calls
- No tracking, analytics, or data collection
- Open-source code for full transparency

## Troubleshooting

### Buttons Don't Appear

- Check that "Show Buttons" is enabled in settings
- Ensure images are larger than 50x50 pixels
- Try refreshing the page

### Translation Fails

- Verify API keys are correctly entered in settings
- Check API key permissions and quotas
- Look for error messages in the browser console
- Ensure you have internet connectivity

### CORS Errors

- The canvas overlay method avoids CORS issues for most images
- Some protected images may still fail to convert
- Try right-clicking the image and opening in a new tab first

### Canvas Position Issues

- The extension automatically adjusts canvas position on scroll/resize
- If issues persist, try refreshing the page

## Browser Compatibility

- ✅ Chrome 88+ (tested)
- ✅ Edge 88+ (tested)
- ✅ Firefox 109+ (requires temporary loading)
- ⚠️ Safari - Not tested (may require modifications)

## Development

### Project Structure

```
readitfortheplot/
├── manifest.json          # Extension manifest (V3)
├── content.js             # Main content script
├── background.js          # Service worker
├── popup/
│   ├── popup.html        # Settings UI
│   ├── popup.css         # Settings styles
│   └── popup.js          # Settings logic
├── styles/
│   └── content.css       # Button and UI styles
├── utils/
│   ├── storage.js        # Storage utilities
│   └── imageHash.js      # Image hashing
└── icons/                # Extension icons
```

### Local Development

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on a webpage with images

### Building for Production

For production deployment:
1. Remove console.log statements
2. Minify JavaScript files
3. Optimize images
4. Package for Chrome Web Store / Firefox Add-ons

## Known Limitations

- **Image Size**: Very large images may take longer to process
- **Complex Layouts**: Text positioning works best with simple, structured images
- **Font Matching**: Uses default fonts (Arial) for translated text
- **API Limits**: Subject to DeepSeek and Gemini rate limits and quotas
- **Dynamic Images**: Some dynamically loaded images may require page refresh

## Roadmap

- [ ] Custom font selection for better visual matching
- [ ] Support for background images (CSS)
- [ ] Batch translate multiple images at once
- [ ] Offline mode with pre-cached translations
- [ ] Text editing before applying translation
- [ ] Export translated images
- [ ] Additional translation providers
- [ ] Browser action to translate all visible images

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the Troubleshooting section above

## Credits

- Icons from [Lucide](https://lucide.dev/)
- OCR powered by [DeepSeek](https://platform.deepseek.com/)
- Translation powered by [Google Gemini](https://ai.google.dev/)

---

**Version**: 1.0.0
**Last Updated**: November 2024
**Status**: Beta - Ready for testing
