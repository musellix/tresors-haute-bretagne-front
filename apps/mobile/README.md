# React Native Mobile App

App mobile React Native avec Expo pour "Les Trésors de Haute Bretagne".

## Stack

- **Framework**: React Native + Expo
- **Router**: Expo Router
- **Language**: TypeScript
- **Platform**: iOS, Android

## Development

```bash
# Installation
npm install

# Démarrer l'app
npm start

# iOS
npm run ios

# Android
npm run android
```

## Build

```bash
# Build iOS et Android (avec EAS)
npm run build

# Build local (preview)
npm run preview
```

## Structure

```
├── app/
│   ├── _layout.tsx          (Navigation root)
│   └── index.tsx            (Écran accueil)
├── assets/
├── package.json
├── app.json                 (Config Expo)
├── tsconfig.json
└── README.md
```

## Développement

L'app démarre avec Expo Metro bundler. Tu peux utiliser:
- **Expo Go App** pour tester sur ton téléphone
- **iOS Simulator** (Mac seulement)
- **Android Emulator**
