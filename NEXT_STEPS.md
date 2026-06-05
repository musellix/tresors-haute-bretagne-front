# Prochaines étapes — Frontend mobile

## 🟠 À faire

### 1. Connexion Google
Nécessite un Google Cloud Console project + client IDs Android/iOS.
- Installer `expo-auth-session` + `expo-web-browser`
- Ajouter bouton "Connexion avec Google" sur l'écran de login
- Appeler `POST /auth/google` avec l'idToken retourné
- Configurer `GOOGLE_CLIENT_ID` dans `docker-compose.dev.yml` et `.env.local`

### 2. Vérification email
Après l'inscription, l'utilisateur reçoit un email de vérification.
Le back renvoie `EMAIL_NOT_VERIFIED` si on essaie de se connecter avant.
- Gérer ce cas dans l'écran de login (message clair + bouton "renvoyer l'email")

### 3. Images réelles des korrigans
Remplacer les emojis 🧙 par les vraies images des korrigans (dossier `images-tmp/korrigans/`)
- Les uploader sur un CDN ou les bundler dans l'app
- Les URL sont stockées côté back dans `korrigan.imageUrl`

### 4. Données réelles en base
Les parcours, étapes, dialogues et questions du dossier `images-tmp/parcours/`
restent à transposer en base de données (travail backend).

## ✅ Fait

- Setup Expo SDK 54 (React Native 0.81, React 19, Expo Router 6)
- Fix monorepo React singleton (React 18 web vs React 19 mobile)
- packages/shared : types TS + client API axios complets
- Auth store Zustand avec persistence SecureStore JWT
- Écran login / register
- Tab navigator (Accueil, Chasses, Korrigans)
- Écran Accueil avec stats joueur et chasses en cours
- Écran Chasses avec recherche + filtres par thème
- Écran Korrigans avec couleurs par personnage
- Fiche parcours (photo, korrigan, infos, CTA démarrer/continuer)
- Gameplay complet : GPS check → Dialogues → Questions → Indices → Coordonnées → Code final
