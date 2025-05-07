// Main initialization function
function initChatGPTPin() {
  // Wait for ChatGPT UI to load completely
  const observer = new MutationObserver((mutations, obs) => {
    const conversationListContainer = document.querySelector('#sidebar');
    if (conversationListContainer) {
      setupPinUI();
      observeConversationChanges(conversationListContainer);
      obs.disconnect(); // Stop observing once we've found the container
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Set up pin UI elements
function setupPinUI() {
  // Check all conversation items and add pin buttons
  const conversationItems = document.querySelectorAll('#sidebar li.relative');
  conversationItems.forEach(addPinButtonToListItem);
  
  // Also set up pin button for current conversation
  addPinButtonToCurrentConversation();
}

// Add pin button to a conversation list item in the sidebar
function addPinButtonToListItem(listItemElement) {
  const linkElement = listItemElement.querySelector('a[data-history-item-link="true"]');
  if (!linkElement) {
    // console.warn('ChatGPTPin: Could not find link element in list item:', listItemElement);
    return;
  }

  // Don't add button if it already exists on the linkElement
  if (linkElement.querySelector('.chatgpt-pin-button')) {
    return;
  }
  
  const pinButton = createPinButton();
  
  const conversationId = extractConversationId(linkElement.href);
  if (!conversationId) {
    // console.warn('ChatGPTPin: Could not extract conversation ID from link:', linkElement.href);
    return;
  }
  
  updatePinButtonState(pinButton, conversationId);
  
  pinButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isActive = pinButton.classList.contains('active');
    
    const titleElement = linkElement.querySelector('div[title]');
    const title = titleElement ? titleElement.getAttribute('title')?.trim() : 'Untitled Conversation';
    
    if (isActive) {
      await unpinConversation(conversationId);
      pinButton.classList.remove('active');
      pinButton.querySelector('.chatgpt-pin-tooltip').textContent = 'Pin this conversation';
    } else {
      const preview = title || 'No preview available'; // Use title as preview from sidebar
      await pinConversation(conversationId, title, preview);
      pinButton.classList.add('active');
      pinButton.classList.add('pin-animation');
      pinButton.querySelector('.chatgpt-pin-tooltip').textContent = 'Unpin this conversation';
      
      setTimeout(() => {
        pinButton.classList.remove('pin-animation');
      }, 300);
    }
    // No need to call updatePinButtonState again here as the visual state is directly managed.
    // If other parts of the UI rely on an event for this change, that might be different.
  });
  
  // Style the link element to accommodate the button
  // The linkElement is already display:flex and items-center from ChatGPT's styles
  linkElement.style.justifyContent = 'space-between'; 
  linkElement.style.overflow = 'visible'; // Attempt to prevent clipping by the link itself

  const titleDiv = linkElement.querySelector('div[title]');
  if (titleDiv) {
    titleDiv.style.minWidth = '0'; // Allow title to shrink smaller than its content
    titleDiv.style.flexShrink = '1'; // Allow title to shrink to make space for the button
  }
  
  // Append the button to the link element
  linkElement.appendChild(pinButton);
}

// Add pin button to current conversation
function addPinButtonToCurrentConversation() {
  // Find the header element - placeholder selector, needs to be updated
  const header = document.querySelector('PUT_CURRENT_CONVERSATION_TITLE_SELECTOR_HERE'); 
  if (!header) {
    // console.warn('ChatGPTPin: Could not find current conversation header element.');
    return;
  }
  
  // Check if button already exists on the header's parent or the header itself
  const parentElement = header.parentElement;
  if (!parentElement || parentElement.querySelector('.chatgpt-pin-button')) {
    // console.warn('ChatGPTPin: Pin button already exists or parent element not found for current conversation.');
    return;
  }
  
  const pinButton = createPinButton(true); // true for larger button
  
  const conversationId = extractConversationId(window.location.href);
  if (!conversationId) {
    // console.warn('ChatGPTPin: Could not extract conversation ID from current URL.');
    return;
  }
  
  updatePinButtonState(pinButton, conversationId);
  
  pinButton.addEventListener('click', async () => {
    const isActive = pinButton.classList.contains('active');
    
    if (isActive) {
      await unpinConversation(conversationId);
      pinButton.classList.remove('active');
      pinButton.querySelector('.chatgpt-pin-tooltip').textContent = 'Pin this conversation';
    } else {
      // For current conversation, try to get title from document.title or header text
      let title = document.title.replace(' - ChatGPT', '').trim();
      if (!title && header.textContent) {
        title = header.textContent.trim();
      }
      title = title || 'Untitled Conversation';

      const preview = getConversationContentPreview(); // Uses first user message
      await pinConversation(conversationId, title, preview);
      pinButton.classList.add('active');
      pinButton.classList.add('pin-animation');
      pinButton.querySelector('.chatgpt-pin-tooltip').textContent = 'Unpin this conversation';
      
      setTimeout(() => {
        pinButton.classList.remove('pin-animation');
      }, 300);
    }
  });
  
  // Add button next to header
  // Ensure the parent element can correctly align the header and the button
  parentElement.style.display = 'flex';
  parentElement.style.justifyContent = 'space-between';
  parentElement.style.alignItems = 'center';
  parentElement.appendChild(pinButton);
}

// Create a pin button element
function createPinButton(isLarge = false) {
  const button = document.createElement('button');
  button.className = 'chatgpt-pin-button';
  button.style.width = isLarge ? '40px' : '32px';
  button.style.height = isLarge ? '40px' : '32px';
  
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 21L12 12M12 12L18 8.4V4.8C18 4.36 17.64 4 17.2 4H6.8C6.36 4 6 4.36 6 4.8V8.4L12 12Z"/>
    </svg>
    <span class="chatgpt-pin-tooltip">Pin this conversation</span>
  `;
  
  return button;
}

// Extract conversation ID from URL
function extractConversationId(url) {
  if (!url) return null; // Add a guard for undefined/null url
  const match = url.match(/chatgpt\.com\/c\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

// Get conversation preview from link element
function getConversationPreview(titleElement) { // Changed parameter to titleElement
  // For sidebar items, the title is the best preview.
  // This function might be more relevant if we had a different source for preview text.
  if (titleElement && titleElement.getAttribute('title')) {
    return titleElement.getAttribute('title').trim() || 'No preview available';
  }
  return 'No preview available';
}

// Get conversation content preview from current page
function getConversationContentPreview() {
  // Try to get the first user message
  const firstUserMessage = document.querySelector('[data-message-author-role="user"]');
  if (firstUserMessage) {
    const text = firstUserMessage.textContent.trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  }
  
  return 'No preview available';
}

// Check if conversation is pinned and update button state
async function updatePinButtonState(buttonElement, conversationId) {
  // const pinnedConversations = await StorageUtil.getPinnedConversations(); // Old way
  const pinnedConversations = await new Promise(resolve => {
    chrome.storage.sync.get(['pinnedConversations'], (result) => {
      resolve(result.pinnedConversations || []);
    });
  });

  const isPinned = pinnedConversations.some(conv => conv.id === conversationId);
  
  if (isPinned) {
    buttonElement.classList.add('active');
    buttonElement.querySelector('.chatgpt-pin-tooltip').textContent = 'Unpin this conversation';
  } else {
    buttonElement.classList.remove('active');
    buttonElement.querySelector('.chatgpt-pin-tooltip').textContent = 'Pin this conversation';
  }
}

// Pin a conversation
async function pinConversation(id, title, preview) {
  // const pinnedConversations = await StorageUtil.getPinnedConversations(); // Old way
  const pinnedConversations = await new Promise(resolve => {
    chrome.storage.sync.get(['pinnedConversations'], (result) => {
      resolve(result.pinnedConversations || []);
    });
  });
  
  // Check if already pinned
  if (pinnedConversations.some(conv => conv.id === id)) {
    return;
  }
  
  const newConversation = {
    id,
    title: title || 'Untitled Conversation',
    preview: preview || 'No preview available',
    url: `https://chatgpt.com/c/${id}`,
    pinnedAt: new Date().toISOString()
  };
  
  pinnedConversations.unshift(newConversation);
  
  // await StorageUtil.setPinnedConversations(pinnedConversations); // Old way
  await new Promise(resolve => {
    chrome.storage.sync.set({ pinnedConversations: pinnedConversations }, () => {
      resolve();
    });
  });
}

// Unpin a conversation
async function unpinConversation(id) {
  // let pinnedConversations = await StorageUtil.getPinnedConversations(); // Old way
  let pinnedConversations = await new Promise(resolve => {
    chrome.storage.sync.get(['pinnedConversations'], (result) => {
      resolve(result.pinnedConversations || []);
    });
  });
  
  pinnedConversations = pinnedConversations.filter(conv => conv.id !== id);
  
  // await StorageUtil.setPinnedConversations(pinnedConversations); // Old way
  await new Promise(resolve => {
    chrome.storage.sync.set({ pinnedConversations: pinnedConversations }, () => {
      resolve();
    });
  });
}

// Observe conversation changes (e.g., new conversations added to the sidebar)
function observeConversationChanges(sidebarContainer) {
  if (!sidebarContainer) return;
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check for new conversation list items
        const newItems = Array.from(mutation.addedNodes)
          .flatMap(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('li.relative')) {
                return [node];
              }
              return Array.from(node.querySelectorAll('li.relative'));
            }
            return [];
          })
          .filter(item => item && !item.querySelector('.chatgpt-pin-button'));
        
        newItems.forEach(addPinButtonToListItem);
      }
    }
  });
  
  observer.observe(sidebarContainer, {
    childList: true,
    subtree: true
  });
}

// Listen for URL changes (for SPA navigation)
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    
    // Check if this is a conversation page and add pin button
    if (window.location.href.includes('chatgpt.com/c/')) {
      // Wait a moment for the page to render
      setTimeout(addPinButtonToCurrentConversation, 500);
    }
  }
});

urlObserver.observe(document, { subtree: true, childList: true });

// Start the extension
initChatGPTPin();