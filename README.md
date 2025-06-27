# Article Image Manager

This is a React application for managing articles and their associated images. It allows users to input an article number, upload images, and store this data in a Neon PostgreSQL database.

## Features

- Upload article numbers and related images
- Store data in Neon PostgreSQL database
- View saved articles and their images
- Responsive design

## Prerequisites

- Node.js and npm installed
- [Neon](https://neon.tech) account for PostgreSQL database

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd neon-article-uploader
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create .env file

Create a `.env` file in the root directory with the following content:

```
DATABASE_URL=postgres://your-username:your-password@your-endpoint.neon.tech/your-database
PORT=5000
```

Replace `your-username`, `your-password`, `your-endpoint`, and `your-database` with your actual Neon database credentials.

### 4. Set up the database

The application will automatically create the necessary tables when the server starts for the first time.

## Running the Application

### Start the backend server

```bash
node server.js
```

### Start the React development server

In a new terminal:

```bash
npm start
```

The application will be available at http://localhost:3000

## How to Use

1. Navigate to the application in your browser
2. Enter an article number in the input field
3. Upload one or more images using the file selector
4. Click "Upload Article" to save
5. View your saved articles in the list below

## Database Schema

### articles table

- `id`: Serial Primary Key
- `article_number`: Unique identifier for the article (VARCHAR)
- `created_at`: Timestamp of creation

### images table

- `id`: Serial Primary Key
- `article_id`: Foreign Key to articles table
- `image_path`: Path to the stored image (VARCHAR)
- `uploaded_at`: Timestamp of upload

## Neon Database Integration

This application uses [Neon](https://neon.tech) for PostgreSQL database hosting. Neon provides:

- Serverless PostgreSQL
- Auto-scaling
- Branching for development
- Built-in connection pooling

To set up your Neon database:
1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project
3. Create a database
4. Get your connection string from the dashboard
5. Add the connection string to your `.env` file

## License

MIT
# Artical
