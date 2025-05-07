// Listen for install event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialize storage with empty pinnedConversations array
    chrome.storage.sync.set({ pinnedConversations: [] });
    
    // Open onboarding page or welcome page if desired
    // chrome.tabs.create({ url: 'welcome.html' });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle any messages if needed
  sendResponse({ success: true });
  return true;  // Required for async response
});