# 🚀 Quick Supabase Setup for Sign Up Functionality

## ⚠️ Current Issue
The application is showing an error because Supabase credentials are not configured. Follow these steps to fix it:

## 📋 Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Enter project details:
   - **Name**: `king-ezekiel-academy`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for setup to complete (2-3 minutes)

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
3. Copy your **anon public key** (starts with `eyJ...`)

### 3. Configure Environment Variables
1. Open the `.env` file in the `client` directory
2. Replace the placeholder values with your actual credentials:

```env
REACT_APP_SUPABASE_URL=https://your-actual-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Run the SQL commands from `SUPABASE_SETUP.md` (Profiles table section)

### 5. Restart the Application
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
```

## ✅ Success Indicators
- No more "Invalid URL" errors in the browser console
- You should see "✅ Supabase client initialized successfully" in the console
- The sign up form should work without errors

## 🧪 Test the Sign Up
1. Go to `http://localhost:3000/signup`
2. Fill out the form with test data
3. Submit the form
4. Check your email for verification
5. Try logging in after verification

## 🔧 Troubleshooting

### If you still see errors:
1. **Check your .env file** - Make sure it has the correct values
2. **Restart the development server** - `npm start`
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
4. **Check browser console** - Look for any remaining errors

### Common Issues:
- **"Invalid URL" error**: Your REACT_APP_SUPABASE_URL is not set correctly
- **"Invalid key" error**: Your REACT_APP_SUPABASE_ANON_KEY is not set correctly
- **Database errors**: Make sure you ran the SQL setup commands

## 📞 Need Help?
1. Check the detailed setup guide in `SUPABASE_SETUP.md`
2. Look at the implementation guide in `SIGNUP_GUIDE.md`
3. Check the browser console for specific error messages

## 🎯 Next Steps
Once Supabase is configured:
1. Test the sign up functionality
2. Set up email templates in Supabase dashboard
3. Configure authentication settings
4. Add more features like password reset

---

**Note**: The application will work in "demo mode" without Supabase, but sign up functionality will show helpful error messages instead of working properly.
