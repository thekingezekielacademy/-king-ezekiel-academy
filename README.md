# 🎓 King Ezekiel Academy

A modern educational platform built with React, TypeScript, and Supabase, designed to empower students and educators with innovative learning experiences.

## 🚀 Features

### ✅ User Authentication
- **Secure Sign Up/Sign In** with Supabase authentication
- **Email verification** for account security
- **Password strength validation** with visual indicators
- **Role-based access** (Student, Parent, Teacher, Administrator)
- **Profile management** with automatic creation

### ✅ Modern UI/UX
- **Responsive design** for all devices
- **Clean, intuitive interface** with Tailwind CSS
- **Real-time form validation** with helpful error messages
- **Loading states** and success feedback
- **Accessible design** following best practices

### ✅ Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS with custom components

## 📋 Project Structure

```
thekingezekielacademy/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   ├── lib/          # Utility libraries (Supabase)
│   │   ├── pages/        # Page components
│   │   └── ...
│   ├── public/           # Static assets
│   └── package.json
├── server/               # Node.js backend API
│   ├── routes/          # API route handlers
│   ├── models/          # Database models
│   ├── middleware/      # Express middleware
│   └── ...
├── styles.css           # Global styles
└── index.html           # Main HTML file
```

## 🛠️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/king-ezekiel-academy.git
cd king-ezekiel-academy
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

### 3. Set Up Supabase (Required for Authentication)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file in the `client` directory:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Run the SQL setup commands from `client/SUPABASE_SETUP.md`

### 4. Start Development Servers
```bash
# Start backend server (from root directory)
npm start

# Start frontend server (from client directory)
cd client
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📚 Documentation

- **[Supabase Setup Guide](client/SUPABASE_SETUP.md)** - Complete Supabase configuration
- **[Sign Up Implementation Guide](client/SIGNUP_GUIDE.md)** - Detailed authentication setup
- **[Quick Setup Guide](client/QUICK_SETUP.md)** - Fast setup instructions

## 🎯 Key Features Implemented

### Authentication System
- ✅ User registration with email/password
- ✅ Email verification
- ✅ Password strength requirements
- ✅ Form validation with real-time feedback
- ✅ Session management
- ✅ Profile creation and management

### User Interface
- ✅ Responsive design for mobile and desktop
- ✅ Modern, clean UI with Tailwind CSS
- ✅ Loading states and error handling
- ✅ Accessible form controls
- ✅ Password visibility toggle
- ✅ Success/error message display

### Security Features
- ✅ Row Level Security (RLS) in Supabase
- ✅ Password hashing and validation
- ✅ Email verification required
- ✅ Secure session management
- ✅ Input validation and sanitization

## 🔧 Development

### Available Scripts
```bash
# Backend (from root directory)
npm start          # Start development server
npm run dev        # Start with nodemon (if configured)

# Frontend (from client directory)
npm start          # Start React development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Environment Variables
Create a `.env` file in the `client` directory:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Frontend Deployment
The React app can be deployed to:
- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `build` folder
- **GitHub Pages**: Use `gh-pages` package

### Backend Deployment
The Node.js server can be deployed to:
- **Heroku**: Connect your GitHub repository
- **Railway**: Easy deployment with GitHub integration
- **DigitalOcean App Platform**: Scalable container deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for authentication and database services
- **React** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **TypeScript** for type safety and better development experience

## 📞 Support

If you have any questions or need help:
1. Check the documentation in the `client/` directory
2. Open an issue on GitHub
3. Contact the development team

---

**Built with ❤️ for the future of education** 