<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iron Ascend

PPL-focused workout tracker with Firestore sync, real-time plans, and PWA install.

## Run Locally

Prerequisites: Node.js 18+

1) Install dependencies: `npm install`
2) (Optional) Set `GEMINI_API_KEY` in [.env.local](.env.local) if you use the AI Studio app entrypoint
3) Start dev server: `npm run dev` (defaults to http://localhost:3000)

## Android / PWA Install

The app is PWA-ready (manifest + service worker). On Android Chrome:
- Open http://localhost:3000 (or your deployed HTTPS URL)
- Wait a moment after the page loads; you should see “Add to Home screen” in the menu or a prompt
- If no prompt, open Chrome menu → “Add to Home screen” → confirm
- Launch from the home screen for a full-screen, standalone experience

Notes:
- Works on HTTPS or localhost; ensure the service worker is reachable at `/sw.js`
- Icons come from the built-in manifest; replace `public/manifest.webmanifest` icons if you want a custom badge

## Deploy

Build: `npm run build`
Preview static build: `npm run preview`
Deploy the `dist/` folder to any static host with HTTPS (service worker requires secure context).

### Firebase Hosting (recommended)

1) Install Firebase CLI: `npm install -g firebase-tools`
2) Login: `firebase login`
3) Select project: `firebase use --add` (choose your Firebase project ID; it also sets `.firebaserc`)
4) Build: `npm run build`
5) Deploy hosting only: `firebase deploy --only hosting`

Notes:
- Hosting config lives in `firebase.json` (SPA rewrite to `index.html`, `sw.js` set to no-cache).
- Ensure `.firebaserc` has your project ID instead of the placeholder.
- Firebase free tier (Spark) covers basic hosting/bandwidth; upgrade if you expect heavy traffic.
