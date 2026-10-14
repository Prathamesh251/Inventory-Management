require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const allowedOrigins = ['http://localhost:8081', 'http://localhost:8080'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// ERPNext URL and Headers configuration
const getHeaders = () => ({
  Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-Frappe-Site-Name': 'frontend'
});

// Proxy ERPNext images (both public and private files)
app.get('/api/file-proxy', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).send('File path required');
    }

    if (!filePath.startsWith('/files/') && !filePath.startsWith('/private/files/')) {
      return res.status(400).send('Invalid file path');
    }

    const url = new URL(filePath, process.env.ERPNEXT_URL);
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) {
      return res.status(response.status).send('File not found in ERPNext');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('File proxy error:', error.message);
    res.status(500).send('Error proxying file');
  }
});

// GET list of Inventory Items
app.get('/api/items', async (req, res) => {
  try {
    const url = new URL('/api/resource/Inventory Item', process.env.ERPNEXT_URL);

    // Fetch fields that exist on the custom Inventory Item DocType
    url.searchParams.set(
      'fields',
      JSON.stringify(['name', 'item_name', 'description', 'image', 'tags', 'date_added', 'creation', 'modified'])
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const mappedItems = (result.data || []).map(item => {
      let img = item.image || '';
      // If image is a relative ERPNext path (/files/ or /private/files/), route through our proxy
      if (img && (img.startsWith('/files/') || img.startsWith('/private/files/'))) {
        img = `${baseUrl}/api/file-proxy?path=${encodeURIComponent(img)}`;
      }

      return {
        name: item.name,
        item_name: item.item_name || '',
        description: item.description || '',
        image: img,
        tags: item.tags || '',
        date_added: item.date_added || (item.modified ? new Date(item.modified).toISOString().split('T')[0] : (item.creation ? new Date(item.creation).toISOString().split('T')[0] : ''))
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

    let finalImg = image ? image.trim() : '';
    const match = finalImg.match(/[?&]path=([^&]+)/);
    if (match) {
      finalImg = decodeURIComponent(match[1]);
    }

    const url = new URL('/api/resource/Inventory Item', process.env.ERPNEXT_URL);

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        item_name: item_name.trim(),
        description: description.trim(),
        image: finalImg,
        tags: tags.trim(),
        date_added: date_added || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
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

// POST upload image
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Persist upload directly to ERPNext so it lives in Frappe's file system
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
      const formData = new FormData();
      formData.append('file', fileBlob, req.file.originalname || req.file.filename);
      formData.append('is_private', '0');

      const erpResponse = await fetch(new URL('/api/method/upload_file', process.env.ERPNEXT_URL), {
        method: 'POST',
        headers: {
          Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
          'X-Frappe-Site-Name': 'frontend'
        },
        body: formData
      });

      const erpResult = await erpResponse.json();
      if (erpResponse.ok && erpResult.message && erpResult.message.file_url) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return res.json({
          url: `${baseUrl}/api/file-proxy?path=${encodeURIComponent(erpResult.message.file_url)}`
        });
      }
    } catch (erpErr) {
      console.warn('ERPNext upload_file fallback to local storage:', erpErr.message);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// PUT update existing Inventory Item
app.put('/api/items/:name', async (req, res) => {
  try {
    const { item_name, description, image, tags, date_added } = req.body;
    const itemNameId = req.params.name;

    const url = new URL(`/api/resource/Inventory Item/${encodeURIComponent(itemNameId)}`, process.env.ERPNEXT_URL);

    const updateData = {};
    if (item_name !== undefined) updateData.item_name = item_name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (image !== undefined) {
      let finalImg = image.trim();
      const match = finalImg.match(/[?&]path=([^&]+)/);
      if (match) {
        finalImg = decodeURIComponent(match[1]);
      }
      updateData.image = finalImg;
    }
    if (tags !== undefined) updateData.tags = tags.trim();
    if (date_added !== undefined && date_added !== '') updateData.date_added = date_added;

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

    const url = new URL(`/api/resource/Inventory Item/${encodeURIComponent(itemNameId)}`, process.env.ERPNEXT_URL);

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