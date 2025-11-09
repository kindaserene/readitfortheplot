// ReadItForThePlot - Background Script
console.log('ReadItForThePlot: Background script loaded!');

// Add a listener to prove it's working
chrome.runtime.onInstalled.addListener(() => {
  console.log('ReadItForThePlot: Extension installed/updated!');
});