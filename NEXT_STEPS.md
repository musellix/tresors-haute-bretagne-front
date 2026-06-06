# Prochaines étapes — Frontend mobile

## 🟠 À faire

### 1. Bug encodage — accents affichés en caractères bizarres
Les textes avec accents (é, è, ê, à, ù...) s'affichent avec des caractères corrompus genre "Ã©", "Ã¨".
Causé par le script PowerShell qui a réécrit les fichiers en UTF-16 au lieu d'UTF-8.
Fix : vérifier l'encodage de tous les fichiers `.tsx` et les sauvegarder en UTF-8 sans BOM.

### 2. Bug UI — menu du bas caché par les boutons de navigation Android
La barre d'onglets (Accueil / Chasses / Korrigans) est partiellement cachée derrière
les boutons de navigation système Android (retour, accueil, multitâche).
Fix : ajouter `paddingBottom` dans `tabBarStyle` via `useSafeAreaInsets().bottom`.

### 3. Bug UI — haut de l'appli caché par la caméra / encoche
Le haut des écrans est rogné par l'encoche ou la caméra perforée du téléphone.
Fix : s'assurer que `SafeAreaProvider` + `SafeAreaView` edges sont bien configurés sur tous les écrans.

### 4. Bouton "afficher le mot de passe" (œil)
Ajouter une icône œil sur le champ mot de passe pour basculer entre texte masqué et visible.
Sur login et register.

### 5. Mot de passe oublié
Ajouter un lien "Mot de passe oublié ?" sur l'écran de login.
Nécessite un endpoint back `POST /auth/forgot-password` (envoi d'un email de reset)
et un écran `/(auth)/forgot-password.tsx`.

### 6. Bug UI — bouton "Se connecter" qui rétrécit au chargement
Quand `isLoading` passe à `true`, le bouton change de taille (le spinner est plus petit que le texte),
ce qui fait bouger tous les éléments autour. Fixer la hauteur du bouton avec `minHeight` fixe.

### 2. Bug UI — clavier masque les champs sur login/register
Quand le clavier s'affiche, les champs mot de passe et le bouton "Se connecter" disparaissent
sous le clavier. Utiliser `ScrollView` + `KeyboardAvoidingView` correctement (behavior `padding`
sur iOS, `height` sur Android) pour que tout reste visible.

### 3. Connexion Google
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
