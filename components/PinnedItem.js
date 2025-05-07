// PinnedItem component for rendering a pinned conversation in the popup
class PinnedItem {
  constructor(conversation, index) {
    this.conversation = conversation;
    this.index = index;
    this.element = this.createElement();
  }
  
  createElement() {
    const li = document.createElement('li');
    li.className = 'conversation-item';
    li.style.animationDelay = `${this.index * 0.05}s`;
    
    // Format date
    const pinnedDate = new Date(this.conversation.pinnedAt);
    const formattedDate = this.formatDate(pinnedDate);
    
    li.innerHTML = `
      <div class="conversation-item">
        <a href="${this.conversation.url}" target="_blank">
          <div class="title">
            ${this.conversation.title}
            <button class="remove-button" title="Unpin conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="preview">${this.conversation.preview}</div>
          <div class="meta">
            <span>Pinned ${formattedDate}</span>
          </div>
        </a>
      </div>
    `;
    
    // Add event listener to remove button
    const removeButton = li.querySelector('.remove-button');
    removeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removePin();
    });
    
    return li;
  }
  
  async removePin() {
    try {
      // Animate removal
      this.element.style.transition = 'all 0.3s ease';
      this.element.style.opacity = '0';
      this.element.style.transform = 'translateX(30px)';
      this.element.style.height = `${this.element.offsetHeight}px`;
      
      // Wait for animation
      setTimeout(async () => {
        this.element.style.height = '0';
        this.element.style.marginBottom = '0';
        this.element.style.padding = '0';
        
        // Remove from storage
        await StorageUtil.removePinnedConversation(this.conversation.id);
        
        // Remove element after height animation
        setTimeout(() => {
          this.element.remove();
          
          // Check if list is empty and show empty state if needed
          const list = document.getElementById('conversations-list');
          if (list.children.length === 0) {
            document.getElementById('no-pins').classList.remove('hidden');
          }
        }, 300);
      }, 300);
    } catch (error) {
      console.error('Error removing pinned conversation:', error);
    }
  }
  
  formatDate(date) {
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}