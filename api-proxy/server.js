require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:8081' }));
app.use(express.json());

// ERPNext URL and Headers configuration
const getHeaders = () => ({
  Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
  Accept: 'application/json',
  'X-Frappe-Site-Name': 'frontend'
});

// Helper to add tags via Frappe API
async function addFrappeTags(itemName, tags) {
  if (!tags) return;
  try {
    const url = new URL('/api/method/frappe.desk.tags.add_tags', process.env.ERPNEXT_URL);
    await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tags, dt: 'Item', dn: itemName })
    });
  } catch (err) {
    console.error('Failed to add tags:', err);
  }
}

// GET list of Inventory Items
app.get('/api/items', async (req, res) => {
  try {
    const url = new URL('/api/resource/Item', process.env.ERPNEXT_URL);

    // Fetch standard fields that exist on the default Item DocType
    url.searchParams.set(
      'fields',
      JSON.stringify(['name', 'item_name', 'description', 'image', 'item_group', 'creation'])
    );

    // Pass through search/filtering if provided by the frontend
    if (req.query.filters) {
      url.searchParams.set('filters', req.query.filters);
    }
    if (req.query.order_by) {
      url.searchParams.set('order_by', req.query.order_by);
    }

    url.searchParams.set('limit_page_length', '100');

    const response = await fetch(url, { headers: getHeaders() });
    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.exception || 'ERPNext API request failed' });
    }

    const mappedItems = (result.data || []).map(item => {
      let extractedTags = '';
      let cleanDescription = item.description || '';

      const tagMatch = cleanDescription.match(/\[TAGS:(.*?)\]/);
      if (tagMatch) {
        extractedTags = tagMatch[1].trim();
        cleanDescription = cleanDescription.replace(/\[TAGS:.*?\]/g, '').trim();
      }

      return {
        ...item,
        description: cleanDescription,
        tags: extractedTags || item.item_group,
        date_added: item.creation ? new Date(item.creation).toISOString().split('T')[0] : ''
      };
    });

    res.json(mappedItems);
  } catch (error) {
    console.error('ERPNext connection error:', error.message);
    res.status(500).json({ error: 'Could not connect to ERPNext' });
  }
});

// POST new Inventory Item
app.post('/api/items', async (req, res) => {
  try {
    const { item_name, description = '', image = '', tags = '', date_added } = req.body;

    if (!item_name?.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const url = new URL('/api/resource/Item', process.env.ERPNEXT_URL);

    let finalDescription = description.trim();
    if (tags.trim()) {
      finalDescription += ` [TAGS:${tags.trim()}]`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        item_code: item_name.trim().replace(/\s+/g, '-').toUpperCase() + '-' + Date.now().toString().slice(-4),
        item_group: 'Products',
        item_name: item_name.trim(),
        description: finalDescription,
        image: image.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.exception || result.message || 'ERPNext could not create the item' });
    }

    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create item error:', error.message);
    res.status(500).json({ error: 'Could not connect to ERPNext' });
  }
});

// PUT update existing Inventory Item
app.put('/api/items/:name', async (req, res) => {
  try {
    const { item_name, description, image, tags, date_added } = req.body;
    const itemNameId = req.params.name;

    const url = new URL(`/api/resource/Item/${encodeURIComponent(itemNameId)}`, process.env.ERPNEXT_URL);

    // Only update fields that were actually passed in the request
    const updateData = {};
    if (item_name !== undefined) updateData.item_name = item_name.trim();
    if (image !== undefined) updateData.image = image.trim();

    if (description !== undefined || tags !== undefined) {
      let currentDesc = description !== undefined ? description.trim() : '';
      let currentTags = tags !== undefined ? tags.trim() : '';
      if (currentTags) {
        updateData.description = `${currentDesc} [TAGS:${currentTags}]`;
      } else {
        updateData.description = currentDesc;
      }
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result.exception || result.message || 'ERPNext could not update the item' });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Update item error:', error.message);
    res.status(500).json({ error: 'Could not connect to ERPNext' });
  }
});

// DELETE an Inventory Item
app.delete('/api/items/:name', async (req, res) => {
  try {
    const itemNameId = req.params.name;

    const url = new URL(`/api/resource/Item/${encodeURIComponent(itemNameId)}`, process.env.ERPNEXT_URL);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { message: responseText };
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: result.exception || result.message || 'ERPNext could not delete the item' });
    }

    res.json({ message: 'Item deleted successfully', name: itemNameId });
  } catch (error) {
    console.error('Delete item error:', error.message);
    res.status(500).json({ error: 'Could not connect to ERPNext' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('API proxy running on http://localhost:3000');
}); 