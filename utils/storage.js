// Storage utility to handle Chrome's storage
const StorageUtil = {
  // Get all pinned conversations
  getPinnedConversations: async function() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['pinnedConversations'], (result) => {
        resolve(result.pinnedConversations || []);
      });
    });
  },
  
  // Set pinned conversations
  setPinnedConversations: async function(conversations) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ pinnedConversations: conversations }, () => {
        resolve();
      });
    });
  },
  
  // Check if a conversation is pinned
  isConversationPinned: async function(conversationId) {
    const conversations = await this.getPinnedConversations();
    return conversations.some(conv => conv.id === conversationId);
  },
  
  // Add a single pinned conversation
  addPinnedConversation: async function(conversation) {
    const conversations = await this.getPinnedConversations();
    
    // Check if already exists
    if (conversations.some(conv => conv.id === conversation.id)) {
      return;
    }
    
    // Add to beginning of array
    conversations.unshift(conversation);
    
    // Save updated list
    await this.setPinnedConversations(conversations);
  },
  
  // Remove a pinned conversation
  removePinnedConversation: async function(conversationId) {
    let conversations = await this.getPinnedConversations();
    conversations = conversations.filter(conv => conv.id !== conversationId);
    await this.setPinnedConversations(conversations);
  }
};