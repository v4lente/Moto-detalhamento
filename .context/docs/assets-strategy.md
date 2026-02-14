# Estratégia de Assets

## Decisão: Assets no Root do Projeto

Os assets estáticos são mantidos na **raiz do projeto** e servidos pelo Express usando `process.cwd()` como base. Isso garante que o servidor encontre os arquivos independentemente do diretório de trabalho atual em diferentes ambientes (dev, build, deploy).

## Configuração em `backend/api/index.ts`

```typescript
import path from "path";

// Assets anexados (imagens, logos, etc.) - servidos em /assets
app.use("/assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Uploads de usuários (imagens de produtos, etc.) - servidos em /uploads
app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));
```

## Diretórios

| URL       | Diretório Físico   | Uso                                      |
| --------- | ------------------ | ---------------------------------------- |
| `/assets` | `attached_assets/`  | Imagens fixas, logos, assets do site     |
| `/uploads`| `public/uploads/`  | Imagens enviadas por usuários (produtos)  |

## Motivação

- **Simplicidade**: Um único local para assets, fácil de versionar e fazer backup
- **Portabilidade**: `process.cwd()` funciona em dev, build e produção
- **Consistência**: Mesma estrutura em todos os ambientes
