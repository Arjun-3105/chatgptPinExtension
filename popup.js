document.addEventListener('DOMContentLoaded', async () => {
  const conversationsList = document.getElementById('conversations-list');
  const noConversations = document.getElementById('no-pins');
  const searchInput = document.getElementById('search-input');
  
  let pinnedConversations = await StorageUtil.getPinnedConversations();
  
  // Display conversations or empty state
  renderConversations(pinnedConversations);
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
      renderConversations(pinnedConversations);
      return;
    }
    
    const filteredConversations = pinnedConversations.filter(conversation => {
      return conversation.title.toLowerCase().includes(searchTerm) || 
             conversation.preview.toLowerCase().includes(searchTerm);
    });
    
    renderConversations(filteredConversations);
  });
  
  // Listen for storage changes (when pins are added/removed)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.pinnedConversations) {
      pinnedConversations = changes.pinnedConversations.newValue || [];
      renderConversations(pinnedConversations);
    }
  });
  
  function renderConversations(conversations) {
    conversationsList.innerHTML = '';
    
    if (!conversations || conversations.length === 0) {
      noConversations.classList.remove('hidden');
      return;
    }
    
    noConversations.classList.add('hidden');
    
    conversations.forEach((conversation, index) => {
      const pinnedItem = new PinnedItem(conversation, index);
      conversationsList.appendChild(pinnedItem.element);
    });
  }
});