import { LitElement, html, css } from 'lit';
import '../components/inventory-item.js';
import { api } from '../services/api.js';

export class InventoryDashboard extends LitElement {
  static properties = {
    viewMode: { type: String }, // 'grid' or 'list'
    items: { type: Array },
    activeTag: { type: String },
    loading: { type: Boolean },
    error: { type: String },
    searchQuery: { type: String },
    sortBy: { type: String }
  };

  static styles = css`
    :host {
      display: flex;
      gap: 48px;
    }
    
    /* Main Content Area */
    .main-content {
      flex-grow: 1;
    }
    
    .header {
      margin-bottom: 24px;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    
    /* Layouts */
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Sidebar */
    .sidebar {
      width: 250px;
      flex-shrink: 0;
    }
    
    .sidebar h3 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }
    
    .tags-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .tags-list li {
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 14px;
    }
    
    .tags-list li:hover {
      color: var(--color-primary);
    }
    
    .tags-list li.active {
      color: var(--color-primary);
      font-weight: 500;
    }

    .loading, .error, .empty {
      padding: 40px 0;
      text-align: center;
      color: var(--color-text-muted);
    }
    
    .error {
      color: #EF4444;
    }
  `;

  constructor() {
    super();
    this.viewMode = 'grid';
    this.activeTag = 'All';
    this.items = [];
    this.loading = true;
    this.error = null;
    this.searchQuery = '';
    this.sortBy = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchItems();
  }

  async fetchItems() {
    this.loading = true;
    this.error = null;
    try {
      this.items = await api.getItems();
    } catch (err) {
      this.error = err.message || 'Failed to load items';
    } finally {
      this.loading = false;
    }
  }

  async handleDelete(name) {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteItem(name);
        this.fetchItems();
      } catch (err) {
        alert(err.message || 'Failed to delete item');
      }
    }
  }

  setTag(tag) {
    this.activeTag = tag;
  }

  get uniqueTags() {
    const tagsSet = new Set();
    this.items.forEach(item => {
      if (item.tags) {
        const tags = item.tags.split(',').map(t => t.trim()).filter(t => t);
        tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }

  get filteredItems() {
    let result = this.items;

    // Apply text search filter
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const name = (item.item_name || item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // Apply tag filter (Note: Since we are querying standard ERPNext items right now, 'tags' doesn't exist on the backend. This filter will always return nothing if not 'All' until we switch back to 'Inventory Item')
    if (this.activeTag !== 'All') {
      result = result.filter(item => {
        if (!item.tags) return false;
        return item.tags.toLowerCase().includes(this.activeTag.toLowerCase());
      });
    }

    // Apply sorting
    if (this.sortBy === 'name') {
      result = result.sort((a, b) => {
        const nameA = (a.item_name || a.name || '').toLowerCase();
        const nameB = (b.item_name || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (this.sortBy === 'dateAdded') {
      result = result.sort((a, b) => {
        const dateA = new Date(a.date_added || 0);
        const dateB = new Date(b.date_added || 0);
        return dateB - dateA; // Newest first
      });
    }

    return result;
  }

  tagItemsLength(tag) {
    let count = 0;
    this.items.forEach(item => {
      if (item.tags) {
        const tags = item.tags.split(',').map(t => t.trim()).filter(t => t);
        if (tags.includes(tag)) {
          count++;
        }
      }
    });
    return count;
  }

  render() {
    const displayItems = this.filteredItems;

    return html`
      <div class="main-content">
        <div class="header">
          <h2>${displayItems.length} items</h2>
        </div>
        
        ${this.loading ? html`<div class="loading">Loading items...</div>` : ''}
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        ${!this.loading && !this.error && displayItems.length === 0 ? html`<div class="empty">No items found.</div>` : ''}
        
        ${!this.loading && displayItems.length > 0 ? html`
          <div class="${this.viewMode === 'grid' ? 'items-grid' : 'items-list'}">
            ${displayItems.map(item => html`
              <inventory-item .item="${item}" view="${this.viewMode}" @delete-item="${(e) => this.handleDelete(e.detail.name)}"></inventory-item>
            `)}
          </div>
        ` : ''}
      </div>
      
      <div class="sidebar">
        <h3>Tags</h3>
        <ul class="tags-list">
          <li class="${this.activeTag === 'All' ? 'active' : ''}" @click="${() => this.setTag('All')}">All [${this.items.length}]</li>
          ${this.uniqueTags.map(tag => html`
            <li class="${this.activeTag === tag ? 'active' : ''}" @click="${() => this.setTag(tag)}">${tag} <span>[${this.tagItemsLength(tag)}]</span></li>
          `)}
        </ul>
      </div> 
    `;
  }
}

customElements.define('inventory-dashboard', InventoryDashboard);

