import { LitElement, html, css } from 'lit';
import './pages/inventory-dashboard.js';
import './pages/inventory-form.js';

export class InventoryApp extends LitElement {
  static properties = {
    currentRoute: { type: String },// 'dashboard' or 'add-item'
    viewMode: { type: String }, //'grid' or 'list'
    searchQuery: { type: String },
    editingItem: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    header {
      background-color: var(--color-white, #fff);
      border-bottom: 1px solid var(--color-border, #E5E7EB);
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo span {
      font-weight: 400;
      color: var(--color-text-muted);
    }
    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .toggles {
      display: flex;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      overflow: hidden;
    }
    .toggles button {
      background: white;
      border: none;
      padding: 8px 12px;
      cursor: pointer;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toggles button.active {
      color: var(--color-primary);
      background: #FFF7ED;
    }
    .toggles button:first-child {
      border-right: 1px solid var(--color-border);
    }
    input[type="search"] {
      padding: 10px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      outline: none;
      width: 250px;
    }
    select.sort-by {
      padding: 10px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      outline: none;
      background: white;
      color: var(--color-text-main);
    }
    button.primary {
      background-color: var(--color-primary, #F97316);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    button.primary:hover {
      background-color: var(--color-primary-hover, #EA580C);
    }
    main {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
    }
  `;

  constructor() {
    super();
    this.currentRoute = 'dashboard';
    this.viewMode = 'grid';
    this.searchQuery = '';
  }

  render() {
    return html`
      <header>
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="8" height="24" rx="2" fill="#F97316"/>
            <rect x="12" width="12" height="24" rx="2" fill="#111827"/>
          </svg>
          Inventory <span>Admin</span>
        </div>
        
        <div class="header-actions">
          ${this.currentRoute === 'dashboard' ? html`
            <input 
              type="search" 
              placeholder="Search" 
              .value="${this.searchQuery}" 
              @input="${(e) => this.searchQuery = e.target.value}" 
            />
            
            <div class="toggles">
              <button class="${this.viewMode === 'list' ? 'active' : ''}" @click="${() => this.viewMode = 'list'}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              </button>
              <button class="${this.viewMode === 'grid' ? 'active' : ''}" @click="${() => this.viewMode = 'grid'}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
            </div>
            
            <select class="sort-by">
              <option value="">Sort By</option>
              <option value="dateAdded">Date Added</option>
              <option value="name">Name</option>
            </select>

            <button class="primary" @click="${() => { this.editingItem = null; this.currentRoute = 'add-item'; }}">
              + Add New
            </button>
          ` : html``}
        </div>
      </header>

      <main @go-back="${() => { this.currentRoute = 'dashboard'; this.editingItem = null; }}">
        ${this.currentRoute === 'dashboard'
        ? html`<inventory-dashboard .viewMode=${this.viewMode} .searchQuery=${this.searchQuery} @edit-item="${(e) => { this.editingItem = e.detail; this.currentRoute = 'add-item'; }}"></inventory-dashboard>`
        : html`<inventory-form .item=${this.editingItem}></inventory-form>`}
      </main>
    `;
  }
}

customElements.define('inventory-app', InventoryApp);
