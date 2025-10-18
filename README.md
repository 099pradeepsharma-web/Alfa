<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Alfanumrik - Adaptive Learning Management System

**Alfanumrik** is an AI-powered adaptive learning platform designed for K-12 CBSE students. The platform leverages Google's Gemini AI to provide personalized learning experiences, real-time assessments, and intelligent content delivery.

## 🎆 Features

- **Adaptive Learning Engine** - AI-powered personalization based on student performance
- **Multi-language Support** - Available in English and Hindi with more languages coming
- **Real-time Assessment** - Instant feedback and performance tracking  
- **Interactive Content** - Engaging educational materials and microlearning modules
- **Progress Analytics** - Comprehensive learning analytics and insights
- **Offline Capability** - Local IndexedDB storage for offline learning
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Gemini API Key** - Get from [Google AI Studio](https://ai.studio/)

### Automated Setup

For the fastest setup experience, use our automated setup scripts:

**Linux/macOS:**
```bash
git clone https://github.com/099pradeepsharma-web/Alfa.git
cd Alfa
chmod +x setup.sh
./setup.sh
```

**Windows:**
```cmd
git clone https://github.com/099pradeepsharma-web/Alfa.git
cd Alfa
setup.bat
```

### Manual Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/099pradeepsharma-web/Alfa.git
   cd Alfa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Gemini API key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=development
VITE_APP_NAME=Alfanumrik
VITE_APP_VERSION=0.0.0
VITE_DEFAULT_LANGUAGE=en
VITE_THEME_MODE=light
```

### Getting Gemini API Key

1. Visit [Google AI Studio](https://ai.studio/)
2. Sign in with your Google account
3. Navigate to "Get API Key"
4. Create or copy an existing API key
5. Add it to your `.env.local` file

## 📜 Technology Stack

- **Frontend:** React 19.2.0 + TypeScript
- **Build Tool:** Vite 6.2.0
- **AI Integration:** Google Gemini API (@google/genai)
- **Database:** IndexedDB (client-side storage)
- **UI Components:** Custom components with Heroicons & Lucide React
- **Charts:** Recharts for data visualization
- **Avatars:** DiceBear for user avatars

## 🏢 Project Structure

```
Alfa/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Language, Theme, etc.)
├── data/              # Static data and curriculum files
├── hooks/             # Custom React hooks
├── screens/           # Main application screens
├── services/          # Business logic and API services
├── translations/      # Multi-language translation files
├── App.tsx            # Root application component
├── types.ts           # TypeScript type definitions
├── databaseService.ts # IndexedDB operations
├── contentService.ts  # Content management service
└── index.html         # Main HTML template
```

## 📊 Database Schema

The application uses IndexedDB with the following stores:

- **`users`** - User profiles and authentication
- **`modules`** - Course modules and lessons
- **`questions`** - Student questions and responses  
- **`performance`** - Learning performance metrics
- **`progress`** - Student progress tracking
- **`achievements`** - Student achievements and badges
- **`studyGoals`** - Learning objectives and goals
- **`teachers`** - Teacher profiles and data
- **`parents`** - Parent accounts and student connections

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run automated setup
./setup.sh        # Linux/macOS
setup.bat         # Windows
```

## 🌐 Deployment

The application is configured for deployment on various platforms:

- **Vercel** - Recommended (zero-config deployment)
- **Netlify** - Includes `_headers` and `_redirects` files
- **GitHub Pages** - Static hosting option
- **Custom Server** - Build and serve with any web server

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add your `GEMINI_API_KEY` in Vercel environment variables
3. Deploy automatically on every push

## 📚 Documentation

- **Setup Guide:** [environment-setup-guide.md](./environment-setup-guide.md)
- **API Documentation:** Coming soon
- **User Manual:** Coming soon
- **Contributing Guide:** Coming soon

## 🔒 Security

- **API Keys:** Never commit API keys to version control
- **Environment Variables:** Use `.env.local` for sensitive data
- **Client-side Storage:** Data stored locally using IndexedDB
- **HTTPS:** Use HTTPS in production for secure API calls

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues:**
   - Ensure your Gemini API key is valid and properly set
   - Check API key permissions and quotas

2. **Build Errors:**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility (18+)

3. **Development Server:**
   - Port 3000 conflicts: Change port in `vite.config.ts`
   - Clear browser cache and restart server

4. **Database Issues:**
   - Clear browser data to reset IndexedDB
   - Check browser console for database errors

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add your feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📧 Contact

- **Developer:** Pradeep Sharma
- **Email:** 099pradeepsharma@gmail.com
- **GitHub:** [@099pradeepsharma-web](https://github.com/099pradeepsharma-web)
- **Project Link:** [https://github.com/099pradeepsharma-web/Alfa](https://github.com/099pradeepsharma-web/Alfa)

---

<div align="center">
  <p><strong>Built with ❤️ for education and powered by AI</strong></p>
  <p>🚀 <strong>Transforming K-12 Education with Adaptive Learning</strong> 🚀</p>
</div>