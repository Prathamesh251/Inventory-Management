const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  //    Fetch all items, optionally with filters and sorting
  async getItems(filters = null, orderBy = null) {
    try {
      const url = new URL(`${API_BASE_URL}/items`);

      if (filters) {
        url.searchParams.set('filters', JSON.stringify(filters));
      }

      if (orderBy) {
        url.searchParams.set('order_by', orderBy);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch items');

      return await response.json();
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Upload an image
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  //    Create a new item
  async createItem(itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  //    Update an existing item
  async updateItem(name, itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  // Delete an item

  async deleteItem(name) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }
};
