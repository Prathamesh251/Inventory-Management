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
    searchQuery: { type: String }
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

    return result;
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
          <li class="${this.activeTag === 'T-shirt' ? 'active' : ''}" @click="${() => this.setTag('T-shirt')}">T-shirt</li>
          <li class="${this.activeTag === 'Trouser' ? 'active' : ''}" @click="${() => this.setTag('Trouser')}">Trouser</li>
        </ul>
      </div>
    `;
  }
}

customElements.define('inventory-dashboard', InventoryDashboard);

