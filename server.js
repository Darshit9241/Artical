const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { Client } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Configure CORS
app.use(cors());
app.use(express.json());

// Set up static file serving
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Serve static files from the React app in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Initialize Neon database client
const client = new Client(process.env.DATABASE_URL || 'postgres://placeholder:placeholder@placeholder.neon.tech/placeholder');

// Connect to database on server start
async function initDb() {
  try {
    await client.connect();
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        article_number VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        article_id INT REFERENCES articles(id) ON DELETE CASCADE,
        image_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// API endpoint to save article with images
app.post('/api/articles', upload.array('images', 5), async (req, res) => {
  const { articleNumber } = req.body;
  const files = req.files;
  
  if (!articleNumber) {
    return res.status(400).json({ message: 'Article number is required' });
  }
  
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'At least one image is required' });
  }
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Insert article
    const articleResult = await client.query(
      'INSERT INTO articles (article_number) VALUES ($1) RETURNING id',
      [articleNumber]
    );
    
    const articleId = articleResult.rows[0].id;
    
    // Insert images
    for (const file of files) {
      await client.query(
        'INSERT INTO images (article_id, image_path) VALUES ($1, $2)',
        [articleId, file.path]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Article and images saved successfully',
      articleId,
      imageCount: files.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving article:', error);
    res.status(500).json({ message: 'Failed to save article', error: error.message });
  }
});

// API endpoint to update an article
app.put('/api/articles/:id', upload.array('images', 5), async (req, res) => {
  const articleId = req.params.id;
  const { articleNumber } = req.body;
  const files = req.files;
  
  if (!articleNumber) {
    return res.status(400).json({ message: 'Article number is required' });
  }
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if article exists
    const checkResult = await client.query(
      'SELECT id FROM articles WHERE id = $1',
      [articleId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Update article number
    await client.query(
      'UPDATE articles SET article_number = $1 WHERE id = $2',
      [articleNumber, articleId]
    );
    
    // Add new images if provided
    if (files && files.length > 0) {
      // Get existing images to delete files
      const imageResult = await client.query(
        'SELECT image_path FROM images WHERE article_id = $1',
        [articleId]
      );
      
      // Delete existing images from the database
      await client.query(
        'DELETE FROM images WHERE article_id = $1',
        [articleId]
      );
      
      // Add new images
      for (const file of files) {
        await client.query(
          'INSERT INTO images (article_id, image_path) VALUES ($1, $2)',
          [articleId, file.path]
        );
      }
      
      // Delete old image files from filesystem
      imageResult.rows.forEach(image => {
        try {
          if (fs.existsSync(image.image_path)) {
            fs.unlinkSync(image.image_path);
          }
        } catch (err) {
          console.error(`Failed to delete file ${image.image_path}:`, err);
          // Continue with other files even if one fails
        }
      });
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Article updated successfully',
      articleId,
      newImagesCount: files ? files.length : 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating article:', error);
    res.status(500).json({ message: 'Failed to update article', error: error.message });
  }
});

// API endpoint to delete an article
app.delete('/api/articles/:id', async (req, res) => {
  const articleId = req.params.id;
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if article exists
    const checkResult = await client.query(
      'SELECT id FROM articles WHERE id = $1',
      [articleId]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Get images to delete files
    const imageResult = await client.query(
      'SELECT image_path FROM images WHERE article_id = $1',
      [articleId]
    );
    
    // Delete from database (will cascade to images table)
    await client.query(
      'DELETE FROM articles WHERE id = $1',
      [articleId]
    );
    
    // Commit database changes
    await client.query('COMMIT');
    
    // Delete image files from filesystem
    imageResult.rows.forEach(image => {
      try {
        if (fs.existsSync(image.image_path)) {
          fs.unlinkSync(image.image_path);
        }
      } catch (err) {
        console.error(`Failed to delete file ${image.image_path}:`, err);
        // Continue with other files even if one fails
      }
    });
    
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting article:', error);
    res.status(500).json({ message: 'Failed to delete article', error: error.message });
  }
});

// API endpoint to get all articles with images
app.get('/api/articles', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT a.id, a.article_number, a.created_at, 
             json_agg(json_build_object('id', i.id, 'path', i.image_path)) as images
      FROM articles a
      LEFT JOIN images i ON a.id = i.article_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Failed to fetch articles' });
  }
});

// In production, serve the React app for any unknown paths
if (isProduction) {
  app.get('*', (req, res) => {
    // Exclude API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  initDb().catch(console.error);
}); 