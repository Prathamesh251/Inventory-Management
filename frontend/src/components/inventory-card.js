
import { LitElement, html, css } from 'lit';

export class InventoryCard extends LitElement {
  static properties = {
    item: { type: Object },
    stockQty: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
    }

    article {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      background: white;
      color: #111827;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
    }

    h2 {
      font-size: 18px;
      margin: 0 0 8px;
    }

    p {
      color: #6b7280;
      margin: 4px 0;
    }

    .item-code {
      font-size: 12px;
      color: #9ca3af;
    }
  `;

  constructor() {
    super();
    this.item = {};
    this.stockQty=0;
  }

  render() {
    return html`
      <article>
        <h2>${this.item.item_name || this.item.name || 'Unnamed item'}</h2>
        <p>${this.item.description || 'No description available'}</p>
        <p class="item-code">Item code: ${this.item.name || 'N/A'}</p>
        <p>Physical stock: ${this.stockQty}</p>
        <button
          @click=${() => this.dispatchEvent(
            new CustomEvent('edit-item', {
              detail: { item: this.item },
              bubbles: true,
              composed: true,
            })
          )}
        >
          Edit
        </button>
        <button
          @click=${() => this.dispatchEvent(
            new CustomEvent('delete-item', {
              detail: { item: this.item },
              bubbles: true,
              composed: true,
            })
          )}
        >
          Delete
        </button>
      </article>
    `;
  }
}

customElements.define('inventory-card', InventoryCard);
