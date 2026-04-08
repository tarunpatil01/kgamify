# kGamify - Job Portal Platform

A modern job portal platform built with React, Node.js, and MongoDB. Companies can post jobs, manage applications, and candidates can apply for positions.

## 🚀 Features

- **Company Registration & Authentication**: Secure company onboarding with admin approval
- **Job Management**: Post, edit, and manage job listings
- **Application System**: Handle job applications with resume uploads
- **Admin Portal**: Approve companies and manage the platform
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes
- **File Upload**: Cloudinary integration for document storage

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Material-UI components
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- Cloudinary for cloud storage

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Cloudinary account

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### for AI
```
cd AI

# Install dependencies
pip install -r requirements.txt

#activate virtual env
.\.venv\Scripts\Activate.ps1

#run server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

#ensure ollama is running and model is installed

```

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://job-portal-backend-629b.onrender.com/api
```

### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
kgamify/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── JobApplications/    # Job-specific components
│   ├── api.js             # API service functions
│   └── main.jsx           # App entry point
├── backend/
│   ├── routes/            # API route handlers
│   ├── models/            # MongoDB schemas
│   ├── config/            # Configuration files
│   └── server.js          # Express server
└── public/                # Static assets
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist folder
```

### Backend (Render/Railway)
```bash
# Set environment variables
# Deploy the backend folder
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.
