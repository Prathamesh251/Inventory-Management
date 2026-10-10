import { LitElement, html, css } from 'lit';
import { api } from '../services/api.js';

export class InventoryForm extends LitElement {
  static properties = {
    isSubmitting: { type: Boolean },
    error: { type: String },
    item: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      max-width: 800px;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    
    .back-btn {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-main);
      padding: 4px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .form-group.full-width {
      grid-column: 1 / -1;
    }
    
    label {
      font-weight: 500;
      font-size: 14px;
    }
    
    label span {
      color: var(--color-primary);
    }
    
    input[type="text"],
    input[type="date"],
    textarea {
      padding: 12px 16px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      outline: none;
      font-family: inherit;
      font-size: 14px;
      width: 100%;
    }
    
    textarea {
      min-height: 120px;
      resize: vertical;
    }
    
    .upload-zone {
      border: 1px dashed var(--color-border);
      border-radius: var(--border-radius);
      padding: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: var(--color-bg);
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .upload-zone:hover {
      background: #F3F4F6;
    }
    
    .upload-zone svg {
      color: var(--color-text-muted);
    }
    
    .upload-text {
      font-weight: 500;
    }
    
    .upload-text span {
      color: var(--color-primary);
    }
    
    .upload-hint {
      color: var(--color-text-muted);
      font-size: 12px;
    }
    
    .tags-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background: white;
      flex-wrap: wrap;
    }
    
    .tags-container input {
      border: none;
      outline: none;
      padding: 4px;
      flex-grow: 1;
      min-width: 150px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border);
    }
    
    .footer-left {
      display: flex;
      gap: 16px;
    }
    
    button.btn {
      padding: 10px 24px;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      font-size: 14px;
    }
    
    button.btn-outline {
      background: white;
      border: 1px solid var(--color-text-main);
      color: var(--color-text-main);
    }
    
    button.btn-outline:hover {
      background: #F9FAFB;
    }
    
    button.btn-primary {
      background: var(--color-primary);
      border: 1px solid var(--color-primary);
      color: white;
    }
    
    button.btn-primary:hover {
      background: var(--color-primary-hover);
    }
    
    button.btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .error-msg {
      color: #EF4444;
      margin-bottom: 16px;
      font-size: 14px;
    }
  `;

  constructor() {
    super();
    this.isSubmitting = false;
    this.error = null;
  }

  _handleBack() {
    this.dispatchEvent(new CustomEvent('go-back', { bubbles: true, composed: true }));
  }

  async _handleSave() {
    const itemName = this.shadowRoot.querySelector('#item_name').value;
    const dateAdded = this.shadowRoot.querySelector('#date_added').value;
    const description = this.shadowRoot.querySelector('#description').value;
    const tags = this.shadowRoot.querySelector('#tags').value; // Using simple comma input for now

    if (!itemName) {
      this.error = 'Item Name is required.';
      return;
    }

    this.error = null;
    this.isSubmitting = true;

    try {
      const payload = {
        item_name: itemName,
        date_added: dateAdded,
        description: description,
        tags: tags,
        image: '' // Skipping real image upload for this
      };

      if (this.item && this.item.name) {
        await api.updateItem(this.item.name, payload);
      } else {
        await api.createItem(payload);
      }

      this._handleBack(); // Return to dashboard on success
    } catch (err) {
      this.error = err.message || 'Failed to save item';
    } finally {
      this.isSubmitting = false;
    }
  }

  render() {
    return html`
      <div class="header">
        <button class="back-btn" @click="${this._handleBack}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2>${this.item ? 'Edit Item' : 'Add New Item'}</h2>
      </div>

      ${this.error ? html`<div class="error-msg">${this.error}</div>` : ''}

      <div class="form-grid">
        <div class="form-group">
          <label>Item Name <span>*</span></label>
          <input type="text" id="item_name" placeholder="Enter item name" .value="${this.item?.item_name || ''}" />
        </div>
        
        <div class="form-group">
          <label>Date <span>*</span></label>
          <input type="date" id="date_added" .value="${this.item?.date_added || ''}" />
        </div>
        
        <div class="form-group full-width">
          <label>Description <span>*</span></label>
          <textarea id="description" placeholder="Type your message..." .value="${this.item?.description || ''}"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>Upload Image</label>
          <div class="upload-zone">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <div class="upload-text">Drop image here or <span>Browse Files</span></div>
            <div class="upload-hint">PNG, JPG upto 5MB</div>
          </div>
        </div>
        
        <div class="form-group full-width">
          <label>Tags</label>
          <div class="tags-container">
            <input type="text" id="tags" placeholder="E.g. T-shirt, Winter, Mens" .value="${this.item?.tags || ''}" />
          </div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-left">
          <button class="btn btn-outline" @click="${this._handleBack}">Cancel</button>
          <button class="btn btn-primary" @click="${this._handleSave}" ?disabled="${this.isSubmitting}">
            ${this.isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('inventory-form', InventoryForm);
