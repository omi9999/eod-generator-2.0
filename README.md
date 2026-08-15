# EOD Report Generator

Full‑stack application to generate End‑of‑Day reports using AI.

## 🚀 Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # fill in your keys
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

### Docker (backend + LibreOffice)
```bash
cd backend
docker build -t eod-backend .
docker run -p 8000:8000 --env-file .env eod-backend
```

## 📱 Mobile (Android APK)
```bash
cd frontend
npm run build   # generates static export in 'out/'
npx @capacitor/cli init EODReport com.example.eodreport
npx @capacitor/cli add android
# copy 'out/' contents to 'android/app/src/main/assets/public/'
npx cap sync android
npx cap open android   # build APK in Android Studio
```

## 🔑 Environment Variables
See `backend/.env.example` and `frontend/.env.local.example` for required keys.

## 🛠️ Tech Stack
- Backend: FastAPI, Supabase, LibreOffice (PDF)
- Frontend: Next.js, Tailwind CSS, Zustand
- Mobile: Capacitor
- Deployment: Vercel (frontend), Render (backend), Supabase (database)

## 📄 License
MIT
