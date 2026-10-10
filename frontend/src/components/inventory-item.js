import { LitElement, html, css } from 'lit';

export class InventoryItem extends LitElement {
  static properties = {
    item: { type: Object },
    view: { type: String } // 'grid' or 'list'
  };

  static styles = css`
    :host {
      display: block;
      background: var(--color-white, #fff);
      border-radius: var(--border-radius);
      overflow: hidden;
      border: 1px solid var(--color-border);
      transition: box-shadow 0.2s;
    }
    :host(:hover) {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
     
    /* Layouts based on view */
    .container {
      display: flex;
    }
    :host([view="grid"]) .container {
      flex-direction: column;
      height: 100%;
    }
    :host([view="list"]) .container {
      flex-direction: row;
      align-items: center;
    }

    /* Image styling */
    .image-wrapper {
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host([view="grid"]) .image-wrapper {
      width: 100%;
      height: 250px;
    }
    :host([view="list"]) .image-wrapper {
      width: 250px;
      height: 180px;
      flex-shrink: 0;
      order: 2; /* In list view, image is on the right according to the design */
      border-left: 1px solid var(--color-border);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Content styling */
    .content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    :host([view="list"]) .content {
      order: 1;
    }

    h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-main);
    }
    
    .description {
      color: var(--color-text-muted);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 24px 0;
      flex-grow: 1;
    }

    .meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .date {
      color: #9CA3AF; /* lighter gray */
      font-size: 12px;
    }
    
    .tag {
      display: inline-block;
      background: #FFF7ED; /* light orange bg */
      color: var(--color-primary);
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      align-self: flex-start;
    }
    
    .actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }

    .tags-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .item-image {
    width: 100%;
    height: 275px;
    object-fit: contain;
    object-position: center;
    display: block;
    background-color: #f5f5f5;
    }
  `;

  constructor() {
    super();
    this.item = {};
    this.view = 'grid';
  }

  _handleDelete(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('delete-item', {
      detail: { name: this.item.name },
      bubbles: true,
      composed: true
    }));
  }

  _handleEdit(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('edit-item', {
      detail: this.item,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.item) return html``;

    const tagsList = this.item.tags ? this.item.tags.split(',').map(t => t.trim()).filter(t => t) : [];

    return html`
      <div class="container" @click="${this._handleEdit}">
        <div class="image-wrapper">
          ${this.item.image
        ? html`<img class="item-image" src="${this.item.image}" alt="${this.item.item_name}" />`
        : html`<span>No Image</span>`}
        </div>
        
        <div class="content">
          <h3>${this.item.item_name || 'Unnamed Item'}</h3>
          <p class="description">${this.item.description || 'No description available.'}</p>
          
          <div class="meta">
            <span class="date">${this.item.date_added || 'N/A'}</span>
            <div class="tags-row">
              ${tagsList.map(tag => html`<span class="tag">${tag}</span>`)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('inventory-item', InventoryItem);
