# Browser Extension: In-Place Image Translation
## Project Context Document

### **Project Overview**
A browser extension that translates text within images directly on any webpage. Users can click on an image and see translated text overlaid on it, making it appear as if the image was originally in the target language.

---

## **Core Requirements**

### **Feature Description**
- Translate images in-place on any website with a single click
- Lightning-fast translation delivery
- Natural appearance - translated text should look integrated with the image

### **Technology Stack Decisions**

**OCR (Text Extraction):**
- DeepSeek OCR API

**Translation:**
- Gemini or DeepSeek (to be finalized - may make configurable)

**Rendering Method:**
- ✅ **Option A: Canvas Overlay** (SELECTED)
  - Transparent `<canvas>` element positioned over original image
  - Translated text drawn on canvas
  - Original image remains untouched
  - Fast, no CORS issues, reversible

**Alternative Rendering Methods (NOT selected):**
- ❌ Option B: Pixel-level image editing (too slow, CORS issues)
- ❌ Option C: HTML text overlay (poor responsive behavior)

---

## **Technical Architecture**

### **Browser Extension Structure**
- Building from scratch (no existing codebase)
- Browser target: **[TO BE DECIDED]** (Chrome/Firefox/Edge/Multi-browser)
- Extension type: Manifest V3 (modern standard)

### **Key Components Needed**
1. **Content Script** - Detects images, injects canvas overlays, handles UI
2. **Background Script** - Manages API calls to DeepSeek OCR & translation service
3. **Popup UI** - Extension settings, language selection, API key management
4. **Storage** - Cache translations, store user preferences

---

## **User Experience Flow**

### **Interaction Method** (TO BE DECIDED)
Options discussed:
- Right-click context menu on images
- Hover icon/button overlay on images
- Extension icon click (translate all visible images)
- Keyboard shortcut
- **[NEEDS DECISION]**

### **Translation Process**
1. User triggers translation on an image
2. Extension shows loading indicator
3. Image sent to DeepSeek OCR API
4. Extracted text sent to translation API (Gemini/DeepSeek)
5. Canvas overlay created with translated text
6. Translated text positioned to match original text location

### **User Preferences** (TO BE CONFIGURED)
- Source language (auto-detect vs manual selection)
- Target language (default: browser language or user-selected)
- API key storage (user provides own keys vs bundled keys)
- Toggle translated/original view
- Translation history/caching

---

## **Outstanding Decisions Required**

### **High Priority**
1. **Translation Service:** Gemini or DeepSeek? Or make it configurable?
2. **User Trigger:** How does user activate translation? (context menu, hover button, keyboard shortcut?)
3. **Browser Support:** Chrome only or multi-browser?
4. **API Key Management:** User provides keys or bundled in extension?
5. **Language Detection:** Auto-detect source language or user selects?

### **Medium Priority**
6. **Visual Feedback:** How to indicate translated vs original images? (badge, border, icon?)
7. **Reversibility:** Can user toggle back to original? How?
8. **Loading Indicator:** Style and placement during processing
9. **Error Handling:** What happens if OCR/translation fails?
10. **Caching Strategy:** Store translations locally to avoid re-processing?

### **Lower Priority**
11. **Image Type Support:** JPG, PNG, SVG, WebP, GIF? Static only or animated?
12. **Dynamic Content:** Handle lazy-loaded images, infinite scroll?
13. **Background Images:** Support CSS background images?
14. **iframes/Shadow DOM:** Support images in iframes?
15. **Image Size Limits:** Min/max dimensions to process?
16. **Performance Target:** Define "lightning fast" (< 1s, < 3s, < 5s?)
17. **Rate Limiting:** Handle API rate limits gracefully
18. **Offline Mode:** Any offline capabilities or always require internet?

---

## **Technical Considerations**

### **Canvas Overlay Implementation Details**
- Position canvas absolutely over image using `getBoundingClientRect()`
- Match canvas dimensions to image dimensions
- Handle responsive images (resize canvas on window resize)
- Z-index management to ensure canvas appears on top
- Pointer-events handling (allow clicks through canvas when needed)

### **Text Positioning Challenge**
- DeepSeek OCR returns bounding boxes for detected text
- Need to map OCR coordinates to canvas coordinates
- Handle text alignment (left, center, right, justified)
- Multi-line text wrapping
- Font size calculation to match original text size

### **Font Styling Approach**
- Option 1: Attempt to match original font (complex, may not be perfect)
- Option 2: Use readable default font (simple, consistent)
- **[NEEDS DECISION]**

### **API Integration**
- DeepSeek OCR API endpoint and authentication
- Gemini/DeepSeek Translation API endpoint and authentication
- Error handling for API failures
- Request/response format parsing
- Rate limiting and retry logic

---

## **Development Phases (High-Level)**

### **Phase 1: MVP Core**
- Basic extension setup (manifest, popup, content script)
- Image detection on page
- User trigger mechanism (simplest approach first)
- DeepSeek OCR integration
- Translation API integration (choose one: Gemini or DeepSeek)
- Basic canvas overlay with translated text

### **Phase 2: Polish & UX**
- Improved text positioning and styling
- Loading indicators and error states
- Toggle translated/original functionality
- Settings UI for language selection
- Caching mechanism

### **Phase 3: Optimization**
- Performance improvements
- Handle edge cases (dynamic images, iframes, etc.)
- Multi-language support refinement
- User testing and feedback integration

---

## **Success Metrics**
- Translation accuracy (qualitative assessment)
- Speed: Time from trigger to translated result displayed
- User satisfaction: Natural appearance of translated text
- Compatibility: Works across major websites without breaking layouts

---

## **Next Steps**
1. ✅ Rendering method decided: Canvas Overlay
2. ✅ OCR service decided: DeepSeek OCR
3. ✅ Translation service narrowed: Gemini or DeepSeek
4. ⏳ **NEXT:** Answer outstanding decision questions (see "Outstanding Decisions Required")
5. ⏳ Create detailed implementation plan (`plan.md`)
6. ⏳ Begin development

---

## **Reference Materials**
- DeepSeek OCR API Documentation: [TO BE ADDED]
- Gemini API Documentation: [TO BE ADDED]
- Chrome Extension Manifest V3 Docs: https://developer.chrome.com/docs/extensions/mv3/
- Canvas API Reference: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Status:** Planning Phase - Awaiting final decisions before implementation