# Code partagé

Fichiers, types et utilitaires partagés entre mobile et web.

```
├── src/
│   ├── types/       (Types TypeScript)
│   ├── api/         (Client API)
│   └── utils/       (Utilitaires)
├── package.json
└── README.md
```

## Usage

Dans mobile ou web:

```json
{
  "dependencies": {
    "@tresors/shared": "workspace:*"
  }
}
```

```typescript
import { User } from '@tresors/shared'
```
