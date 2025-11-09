// ReadItForThePlot - Content Script
console.log('ReadItForThePlot: Extension loaded!');

// Run immediately (don't wait for DOMContentLoaded)
console.log('ReadItForThePlot: Page ready!');
console.log('ReadItForThePlot: Document state is:', document.readyState);

// Also listen for DOMContentLoaded just in case
document.addEventListener('DOMContentLoaded', () => {
  console.log('ReadItForThePlot: DOMContentLoaded fired!');
});