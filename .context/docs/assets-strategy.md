# Estrategia de Assets

## Decisao: assets estaticos no projeto, uploads em pasta configuravel

Assets estaticos continuam em `attached_assets/` e sao servidos em `/assets`.
Uploads do admin usam uma estrategia de escrita unica e leitura compativel:

- Escrita: `UPLOADS_DIR` quando configurado; senao `public/uploads`.
- Leitura: `UPLOADS_DIR` primeiro e `public/uploads` como fallback legado.
- URLs salvas no banco continuam no formato `/uploads/<arquivo>.jpg`.

## Configuracao em `backend/api/index.ts`

```typescript
import path from "path";
import { ensureUploadsWriteDir, resolveUploadsReadDirs } from "./lib/uploads-dir";

app.use("/assets", express.static(path.resolve(process.cwd(), "attached_assets")));

const uploadsWriteDir = ensureUploadsWriteDir();
const uploadsReadDirs = resolveUploadsReadDirs();
uploadsReadDirs.forEach((uploadsDir) => {
  app.use("/uploads", express.static(uploadsDir));
});
```

## Diretorios

| URL        | Diretorio fisico                         | Uso                                  |
| ---------- | ---------------------------------------- | ------------------------------------ |
| `/assets`  | `attached_assets/`                       | Imagens fixas, logos, assets do site |
| `/uploads` | `UPLOADS_DIR` + fallback `public/uploads` | Imagens enviadas pelo admin          |

## Motivacao

- Persistencia: uploads novos sobrevivem a redeploys quando `UPLOADS_DIR` aponta para pasta persistente.
- Compatibilidade: imagens antigas/versionadas em `public/uploads` continuam aparecendo.
- Simplicidade: o banco nao muda e as URLs publicas continuam iguais.
