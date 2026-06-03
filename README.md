# React Native + React Web Monorepo

Monorepo "Les Trésors de Haute Bretagne" avec:
- **apps/mobile**: React Native (Expo) - iOS, Android
- **apps/web**: React (Vite) - Web responsive
- **packages/shared**: Code partagé

## Structure

```
├── apps/
│   ├── mobile/          (React Native - Expo)
│   └── web/             (React - Vite)
├── packages/
│   └── shared/          (Code partagé)
├── package.json         (Workspace root)
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Installation

```bash
npm install
```

## Développement

```bash
# Mobile (Expo)
npm run dev:mobile

# Web
npm run dev:web
```

## Build

```bash
# Mobile (iOS + Android avec EAS)
npm run build:mobile

# Web
npm run build:web
```

## Configuration Docker

Le Dockerfile build tout le monorepo et peut lancer web ou mobile.
