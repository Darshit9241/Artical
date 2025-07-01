# Vercel Deployment Guide

This guide will help you deploy your Neon Article Uploader application to Vercel.

## Prerequisites

1. A Vercel account
2. A Neon database (or any PostgreSQL database)

## Deployment Steps

### 1. Push your code to GitHub

Make sure your code is in a GitHub repository.

### 2. Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: `./Artical`
   - Build Command: `npm run vercel-build`
   - Output Directory: `build`

### 3. Environment Variables

Add the following environment variables in the Vercel project settings:

- `NODE_ENV`: `production`
- `DATABASE_URL`: Your Neon database connection string (e.g., `postgres://user:password@host:port/database`)

### 4. Deploy

Click "Deploy" and wait for the deployment to complete.

## Troubleshooting

### File Storage Issues

Vercel has an ephemeral filesystem, meaning files uploaded to the server won't persist between function invocations. For production use, you should:

1. Use a cloud storage service like AWS S3, Google Cloud Storage, or Cloudinary for file uploads
2. Update the server code to store file paths in the database but upload files to cloud storage

### Database Connection Issues

If you're having issues connecting to your Neon database:

1. Make sure your DATABASE_URL is correctly set in Vercel environment variables
2. Check that your Neon database allows connections from Vercel's IP addresses
3. Verify your database credentials are correct

### API Connection Issues

If your frontend can't connect to your API:

1. Make sure all API calls use relative URLs (e.g., `/api/articles` instead of `http://localhost:5000/api/articles`)
2. Check that the `vercel.json` file is correctly configured to route API requests to your server

## Important Notes

- The `/tmp` directory is the only writable directory in Vercel Functions
- Files stored in `/tmp` are temporary and may be deleted between function invocations
- For a production application, implement cloud storage for file uploads 