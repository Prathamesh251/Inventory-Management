require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:8081' }));
app.use(express.json());

app.get('/api/items', async (req, res) => {
  try {
    const url = new URL(
      '/api/resource/Item',
      process.env.ERPNEXT_URL
    );

    url.searchParams.set(
      'fields',
      JSON.stringify(['name', 'item_name', 'description','item_group'])
    );

    url.searchParams.set('limit_page_length', '100');

    const response = await fetch(url, {
      headers: {
        Authorization:
          `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        Accept: 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: result.exception || 'ERPNext API request failed',
      });
    }

    res.json(result.data);
  } catch (error) {
    console.error('ERPNext connection error:', error.message);
    res.status(500).json({ error: 'Could not connect to ERPNext' });
  }
});

app.get('/api/stock-balances', async (req, res) => {
  try {
    const url = new URL(
      '/api/resource/Bin',
      process.env.ERPNEXT_URL
    );

    url.searchParams.set(
      'fields',
      JSON.stringify([
        'item_code',
        'warehouse',
        'actual_qty',
        'reserved_qty',
        'projected_qty',
      ])
    );

    url.searchParams.set('limit_page_length', '500');

    const response = await fetch(url, {
      headers: {
        Authorization:
          `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        Accept: 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          result.exception ||
          result.message ||
          'Could not fetch stock balances',
      });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Stock balance error:', error.message);

    res.status(500).json({
      error: 'Could not connect to ERPNext',
    });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const {
      item_code,
      item_name,
      description = '',
      item_group = 'Products',
      stock_uom = 'Nos',
    } = req.body;

    if (
      !item_code?.trim() ||
      !item_name?.trim()
    ) {
      return res.status(400).json({
        error: 'Item code and item name are required',
      });
    }

    const url = new URL(
      '/api/resource/Item',
      process.env.ERPNEXT_URL
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:
          `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        item_code: item_code.trim(),
        item_name: item_name.trim(),
        description: description.trim(),
        item_group,
        stock_uom,
        is_stock_item: 1,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          result.exception ||
          result.message ||
          'ERPNext could not create the item',
      });
    }

    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create item error:', error.message);
    res.status(500).json({
      error: 'Could not connect to ERPNext',
    });
  }
});

app.put('/api/items/:itemCode', async (req, res) => {
  try {
    const { item_name, description = '' } = req.body;
    const itemCode = req.params.itemCode;

    if (!item_name?.trim()) {
      return res.status(400).json({
        error: 'Item name is required',
      });
    }

    const url = new URL(
      `/api/resource/Item/${encodeURIComponent(itemCode)}`,
      process.env.ERPNEXT_URL
    );

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization:
          `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        item_name: item_name.trim(),
        description: description.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          result.exception ||
          result.message ||
          'ERPNext could not update the item',
      });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Update item error:', error.message);
    res.status(500).json({
      error: 'Could not connect to ERPNext',
    });
  }
});

app.delete('/api/items/:itemCode', async (req, res) => {
  try {
    const itemCode = req.params.itemCode;

    const url = new URL(
      `/api/resource/Item/${encodeURIComponent(itemCode)}`,
      process.env.ERPNEXT_URL
    );

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization:
          `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        Accept: 'application/json',
      },
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { message: responseText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          result.exception ||
          result.message ||
          'ERPNext could not delete the item',
      });
    }

    res.json({
      message: 'Item deleted successfully',
      item_code: itemCode,
    });
  } catch (error) {
    console.error('Delete item error:', error.message);
    res.status(500).json({
      error: 'Could not connect to ERPNext',
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('API proxy running on http://localhost:3000');
});