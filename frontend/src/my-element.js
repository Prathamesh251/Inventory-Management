
import { LitElement, css, html } from 'lit';
import './components/inventory-card.js';

export class MyElement extends LitElement {
  static properties = {
    items: { type: Array },
    loading: { type: Boolean },
    error: { type: String },
    searchTerm: { type: String },
    selectedGroup: { type: String },
    stockBalances: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
      padding: 24px;
      font-family: Arial, sans-serif;
      background: #f9fafb;
      min-height: 100vh;
      color: #111827;
    }

    header {
      margin-bottom: 24px;
    }

    h1 {
      margin-bottom: 6px;
    }

    .subtitle {
      color: #6b7280;
    }

    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .message {
      padding: 16px;
      background: white;
      border-radius: 8px;
    }

    button {
      padding: 10px 16px;
      margin-bottom: 20px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      cursor: pointer;
    }
    
    form {
      display: grid;
      gap: 12px;
      max-width: 500px;
      padding: 20px;
      margin-bottom: 24px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 14px;
    }

    input {
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font: inherit;
    }
    
    .inventory-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
    }

    .inventory-filters input,
    .inventory-filters select {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font: inherit;
      background: white;
    }

    .inventory-filters input {
      flex: 1;
      min-width: 220px;
    }

    .inventory-filters p {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

  `;

  constructor() {
    super();
    this.items = [];
    this.loading = true;
    this.error = '';
    this.searchTerm = '';
    this.selectedGroup = 'All';
    this.stockBalances = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchItems();
  }

  async fetchItems() {
    this.loading = true;
    this.error = '';

    try {
      const response = await fetch('http://localhost:3000/api/items');

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(data.error || 'Unexpected API response');
      }

      this.items = data;
      await this.fetchStockBalances();
    } catch (error) {
      console.error('Failed to load inventory:', error);
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async createItem(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const item = {
      item_code: formData.get('item_code'),
      item_name: formData.get('item_name'),
      description: formData.get('description'),
      item_group: formData.get('item_group'),
      stock_uom: formData.get('stock_uom'),
    };

    try {
      const response = await fetch('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create item');
      }

      form.reset();
      await this.fetchItems();

      alert('Item created successfully in ERPNext!');
    } catch (error) {
      console.error('Create item error:', error);
      alert(`Could not create item: ${error.message}`);
    }
  }

  async editItem(event) {
    const item = event.detail.item;

    const itemName = prompt(
      'Enter the new item name:',
      item.item_name || ''
    );

    if (itemName === null) return;

    const description = prompt(
      'Enter the new description:',
      item.description || ''
    );

    if (description === null) return;

    if (!itemName.trim()) {
      alert('Item name cannot be empty.');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/items/${encodeURIComponent(item.name)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_name: itemName,
            description,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update item');
      }

      await this.fetchItems();
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Update item error:', error);
      alert(`Could not update item: ${error.message}`);
    }
  }

  async deleteItem(event) {
    const item = event.detail.item;

    const confirmed = confirm(
      `Are you sure you want to delete "${item.item_name}" (${item.name})?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/items/${encodeURIComponent(item.name)}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to delete item'
        );
      }

      await this.fetchItems();
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Delete item error:', error);
      alert(`Could not delete item: ${error.message}`);
    }
  }

  get filteredItems() {
    const search = this.searchTerm.trim().toLowerCase();

    return this.items.filter(item => {
      const matchesSearch =
        (item.item_name || '').toLowerCase().includes(search) ||
        (item.name || '').toLowerCase().includes(search);

      const matchesGroup =
        this.selectedGroup === 'All' ||
        item.item_group === this.selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }

  get itemGroups() {
    return [
      ...new Set(
        this.items
          .map(item => item.item_group)
          .filter(Boolean)
      ),
    ].sort();
  }

  async fetchStockBalances() {
    const response = await fetch(
      'http://localhost:3000/api/stock-balances'
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Failed to fetch stock balances'
      );
    }

    if (!Array.isArray(result)) {
      throw new Error('Unexpected stock balance response');
    }

    this.stockBalances = result;
  }

  get stockByItem() {
    return this.stockBalances.reduce((totals, balance) => {
      const itemCode = balance.item_code;

      totals[itemCode] =
        (totals[itemCode] || 0) +
        Number(balance.actual_qty || 0);

      return totals;
    }, {});
  }

  render() {
    return html`
      <header>
        <h1>Inventory Management</h1>
        <p class="subtitle">
          Inventory items synced from ERPNext
        </p>
      </header>

      <form @submit=${this.createItem}>
        <h2>Add Inventory Item</h2>

        <label>
          Item Code
          <input
            name="item_code"
            placeholder="ITEM-1001"
            required
          />
        </label>

        <label>
          Item Name
          <input
            name="item_name"
            placeholder="Wireless Mouse"
            required
          />
        </label>

        <label>
          Description
          <input
            name="description"
            placeholder="Optional description"
          />
        </label>

        <label>
          Item Group
          <input
            name="item_group"
            value="Products"
            required
          />
        </label>

        <label>
          Stock UOM
          <input
            name="stock_uom"
            value="Nos"
            required
          />
        </label>

        <button type="submit">Create Item</button>
      </form>

      <button @click=${this.fetchItems}>Refresh inventory</button>

      <section class="inventory-filters">
        <input
          type="search"
          placeholder="Search by item name or code..."
          .value=${this.searchTerm}
          @input=${event => {
            this.searchTerm = event.target.value;
          }}
        />

        <select
          .value=${this.selectedGroup}
          @change=${event => {
            this.selectedGroup = event.target.value;
          }}
        >
          <option value="All">All Item Groups</option>
          ${this.itemGroups.map(
            group => html`
              <option value=${group}>${group}</option>
            `
          )}
        </select>

        <p>
          Showing ${this.filteredItems.length} of ${this.items.length} items
        </p>
      </section>

      ${this.loading
        ? html`<p class="message">Loading inventory...</p>`
        : this.error
          ? html`
              <p class="message">
                Could not load inventory: ${this.error}
              </p>
            `
          : this.items.length === 0
            ? html`<p class="message">No inventory items found.</p>`
            : html`
                <div class="inventory-grid">
                  ${this.filteredItems.map(
                    item => html`
                      <inventory-card
                        .item=${item}
                        .stockQty=${this.stockByItem[item.name] ?? 0}
                        @edit-item=${this.editItem}
                        @delete-item=${this.deleteItem}
                        key=${item.name}
                      ></inventory-card>
                    `
                  )}
                </div>
              `}
    `;
  }
}

customElements.define('my-element', MyElement);
