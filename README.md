# Daniel Valente Moto Detalhamento

E-commerce completo para negócio de detalhamento de motocicletas, com catálogo de produtos, checkout via WhatsApp, sistema de agendamento de serviços e painel administrativo completo.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Componentes](#componentes)
- [Modelos de Dados](#modelos-de-dados)
- [API](#api)
- [Migrações de Banco de Dados](#migrações-de-banco-de-dados)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Design System](#design-system)

---

## Funcionalidades

### Para Clientes
- **Catálogo de Produtos** - Navegue por produtos com múltiplas imagens em carrossel, descrições, preços e avaliações
- **Variações de Produtos** - Suporte a variações (tamanhos, cores) com preços e estoque individuais
- **Carrinho de Compras** - Adicione produtos, ajuste quantidades e finalize via WhatsApp
- **Sistema de Avaliações** - Avalie produtos após a compra com estrelas e comentários
- **Agendamento de Serviços** - Solicite pré-agendamentos para serviços de detalhamento
- **Conta do Cliente** - Cadastro, login, histórico de pedidos e gerenciamento de perfil
- **Galeria de Trabalhos** - Veja exemplos de serviços realizados com fotos e vídeos do YouTube

### Para Administradores
- **Dashboard** - Visão geral de pedidos, clientes, agendamentos e métricas
- **Gestão de Produtos** - CRUD completo com upload de múltiplas imagens e variações
- **Gestão de Pedidos** - Acompanhe e atualize status dos pedidos
- **Gestão de Clientes** - Visualize e gerencie clientes cadastrados
- **Gestão de Usuários** - Controle de acesso de administradores (admin/editor)
- **Serviços Oferecidos** - Cadastre serviços com preços aproximados e exemplos de trabalhos
- **Galeria de Serviços** - Adicione trabalhos realizados com fotos e vídeos
- **Agenda de Serviços** - Calendário visual com gestão de agendamentos
- **Configurações do Site** - Personalize textos, logo, imagens, redes sociais e endereço

---

## Arquitetura

A aplicação segue uma arquitetura monolítica moderna com separação clara entre frontend e backend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Pages  │  │Components│  │  Hooks  │  │  React Query    │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
│       └────────────┴────────────┴────────────────┘          │
│                           │                                  │
│                      API Client                              │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────┼─────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ Routes  │──│ Storage │──│ Drizzle ORM │──│ PostgreSQL │  │
│  └─────────┘  └─────────┘  └─────────────┘  └────────────┘  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ Object Storage  │  │ Session Manager  │                  │
│  └─────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Padrões Utilizados

- **Repository Pattern** - Camada de storage abstrai acesso ao banco
- **Shared Schema** - Schemas Drizzle/Zod compartilhados entre frontend e backend
- **Server State Management** - TanStack React Query para cache e sincronização
- **Component Composition** - Componentes UI modulares com shadcn/ui

---

## Tecnologias

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19.x | Framework UI |
| TypeScript | 5.6 | Tipagem estática |
| Vite | 7.x | Build tool e dev server |
| Tailwind CSS | 4.x | Estilização utility-first |
| shadcn/ui | - | Componentes UI acessíveis |
| Radix UI | - | Primitivos headless |
| TanStack Query | 5.x | Server state management |
| Wouter | 3.x | Roteamento client-side |
| Lucide React | - | Biblioteca de ícones |
| Framer Motion | 12.x | Animações |
| React Hook Form | 7.x | Gerenciamento de formulários |
| Zod | 3.x | Validação de schemas |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Express.js | 5.x | Framework HTTP |
| TypeScript | 5.6 | Tipagem estática |
| Drizzle ORM | 0.39 | Object-Relational Mapping |
| PostgreSQL | - | Banco de dados relacional |
| express-session | 1.x | Gerenciamento de sessões |
| Passport.js | 0.7 | Autenticação |
| Resend | 4.x | Envio de emails |

### Integrações Externas
- **WhatsApp Business** - Checkout e notificações via deep link
- **Google Fonts** - Oxanium (títulos) e Inter (texto)
- **YouTube Embed** - Vídeos na galeria de serviços
- **Object Storage** - Upload de imagens e arquivos

---

## Estrutura do Projeto

```
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes da aplicação
│   │   │   ├── ui/             # Componentes shadcn/ui (50+)
│   │   │   ├── layout.tsx      # Layout principal com header/footer
│   │   │   ├── product-card.tsx # Card de produto com carrossel
│   │   │   ├── checkout-dialog.tsx # Modal de checkout
│   │   │   ├── admin-navbar.tsx # Navegação do admin
│   │   │   ├── ImageUpload.tsx  # Upload com crop de imagens
│   │   │   └── ObjectUploader.tsx # Upload para Object Storage
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── home.tsx        # Página inicial
│   │   │   ├── produtos.tsx    # Listagem de produtos
│   │   │   ├── produto.tsx     # Detalhe do produto
│   │   │   ├── admin.tsx       # Painel administrativo
│   │   │   ├── conta.tsx       # Área do cliente
│   │   │   ├── agendar.tsx     # Agendamento de serviços
│   │   │   └── login.tsx       # Login de clientes
│   │   ├── lib/                # Utilitários
│   │   │   ├── api.ts          # Cliente HTTP centralizado
│   │   │   ├── cart.tsx        # Context do carrinho
│   │   │   ├── queryClient.ts  # Configuração React Query
│   │   │   └── utils.ts        # Funções auxiliares
│   │   └── hooks/              # Custom React hooks
│   │       └── use-mobile.tsx  # Detecção de dispositivo
│   └── index.html              # Template HTML
│
├── server/                     # Backend Express
│   ├── index.ts                # Setup do servidor e middlewares
│   ├── routes.ts               # Definição de rotas da API
│   ├── storage.ts              # Interface e implementação de storage
│   ├── static.ts               # Serving de arquivos estáticos
│   └── vite.ts                 # Integração com Vite em dev
│
├── shared/                     # Código compartilhado
│   └── schema.ts               # Schemas Drizzle + Zod
│
├── db/                         # Configuração do banco
│   └── index.ts                # Pool de conexão + migrações
│
├── migrations/                 # Arquivos de migração SQL
│   ├── *.sql                   # Migrations geradas
│   └── meta/                   # Metadados das migrações
│
├── drizzle.config.ts           # Configuração Drizzle Kit
├── tailwind.config.ts          # Configuração Tailwind
├── vite.config.ts              # Configuração Vite
└── tsconfig.json               # Configuração TypeScript
```

---

## Componentes

### Páginas (`client/src/pages/`)

| Página | Rota | Descrição |
|--------|------|-----------|
| `home.tsx` | `/` | Landing page com hero, produtos em destaque e informações |
| `produtos.tsx` | `/produtos` | Catálogo com filtros por categoria e busca |
| `produto.tsx` | `/produto/:id` | Detalhes do produto com carrossel, variações e avaliações |
| `admin.tsx` | `/admin` | Painel administrativo com todas as gestões |
| `conta.tsx` | `/conta` | Área do cliente com perfil e histórico |
| `agendar.tsx` | `/agendar` | Formulário de pré-agendamento |
| `login.tsx` | `/login` | Login de clientes |

### Componentes de UI (`client/src/components/ui/`)

A aplicação utiliza **50+ componentes** da biblioteca shadcn/ui, incluindo:

- **Layout**: Card, Dialog, Sheet, Drawer, Tabs, Accordion
- **Forms**: Input, Select, Checkbox, Radio, Switch, DatePicker
- **Navigation**: Button, Menu, Breadcrumb, Pagination
- **Feedback**: Alert, Toast, Progress, Skeleton, Spinner
- **Data Display**: Table, Badge, Avatar, Carousel, Chart

### Componentes Customizados

| Componente | Descrição |
|------------|-----------|
| `layout.tsx` | Layout principal com header responsivo, navegação e footer |
| `product-card.tsx` | Card de produto com carrossel de imagens e navegação |
| `checkout-dialog.tsx` | Modal de finalização de compra com integração WhatsApp |
| `admin-navbar.tsx` | Sidebar de navegação do painel admin |
| `ImageUpload.tsx` | Upload de imagem com crop e redimensionamento |
| `ObjectUploader.tsx` | Upload para Object Storage com progress |

---

## Modelos de Dados

### Users (Administradores)
```typescript
{
  id: string (UUID)
  username: string
  password: string (hashed)
  role: 'admin' | 'editor'
  createdAt: timestamp
}
```

### Products (Produtos)
```typescript
{
  id: serial
  name: string
  description: string
  price: number
  image: string (URL principal)
  images: string[] (URLs adicionais)
  category: string
  inStock: boolean
  createdAt: timestamp
}
```

### ProductVariations (Variações)
```typescript
{
  id: serial
  productId: number (FK)
  label: string
  price: number
  inStock: boolean
  createdAt: timestamp
}
```

### Customers (Clientes)
```typescript
{
  id: string (UUID)
  email: string (unique)
  phone: string
  name: string
  nickname: string?
  deliveryAddress: string?
  password: string? (hashed)
  isRegistered: boolean
  createdAt: timestamp
}
```

### Orders (Pedidos)
```typescript
{
  id: serial
  customerId: string? (FK)
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  customerName: string
  customerPhone: string
  customerEmail: string?
  deliveryAddress: string?
  whatsappMessage: string?
  createdAt: timestamp
}
```

### OrderItems (Itens do Pedido)
```typescript
{
  id: serial
  orderId: number (FK)
  productId: number? (FK)
  productName: string
  productPrice: number
  quantity: number
}
```

### Reviews (Avaliações)
```typescript
{
  id: serial
  productId: number (FK)
  customerId: string? (FK)
  customerName: string
  rating: number (1-5)
  comment: string?
  createdAt: timestamp
}
```

### ServicePosts (Galeria de Serviços)
```typescript
{
  id: serial
  title: string
  description: string?
  clientName: string?
  vehicleInfo: string?
  mediaUrls: string[]
  mediaTypes: string[]
  isHighlight: boolean
  createdAt: timestamp
}
```

### Appointments (Agendamentos)
```typescript
{
  id: serial
  customerId: string? (FK)
  customerName: string
  customerPhone: string
  customerEmail: string?
  vehicleInfo: string
  serviceDescription: string
  preferredDate: timestamp
  confirmedDate: timestamp?
  status: 'pre_agendamento' | 'confirmado' | 'concluido' | 'cancelado'
  adminNotes: string?
  estimatedPrice: number?
  createdAt: timestamp
  updatedAt: timestamp
}
```

### OfferedServices (Serviços Oferecidos)
```typescript
{
  id: serial
  name: string
  details: string
  approximatePrice: number?
  exampleWorkId: number? (FK para ServicePosts)
  isActive: boolean
  createdAt: timestamp
}
```

### SiteSettings (Configurações)
```typescript
{
  id: serial
  heroTitle: string?
  heroSubtitle: string?
  whatsappNumber: string?
  instagramUrl: string?
  facebookUrl: string?
  youtubeUrl: string?
  address: string?
  aboutText: string?
  logoUrl: string?
  heroImageUrl: string?
  mapsUrl: string?
  mapsEmbedUrl: string?
  openingHours: string?
  phoneNumber: string?
}
```

---

## API

### Endpoints Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products` | Lista todos os produtos |
| GET | `/api/products/:id` | Detalhes de um produto |
| GET | `/api/products/:id/variations` | Variações de um produto |
| GET | `/api/products/:id/reviews` | Avaliações de um produto |
| GET | `/api/site-settings` | Configurações do site |
| GET | `/api/service-posts` | Posts da galeria de serviços |
| GET | `/api/offered-services` | Serviços oferecidos |
| POST | `/api/checkout` | Processa checkout (cria pedido) |
| POST | `/api/appointments` | Cria pré-agendamento |

### Endpoints de Cliente (Autenticado)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/customers/me` | Dados do cliente logado |
| PUT | `/api/customers/:id` | Atualiza dados do cliente |
| GET | `/api/customers/:id/orders` | Histórico de pedidos |
| POST | `/api/reviews` | Cria avaliação |

### Endpoints Administrativos (Autenticado + Admin)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/stats` | Estatísticas do dashboard |
| CRUD | `/api/admin/products` | Gestão de produtos |
| CRUD | `/api/admin/customers` | Gestão de clientes |
| CRUD | `/api/admin/orders` | Gestão de pedidos |
| CRUD | `/api/admin/users` | Gestão de usuários admin |
| CRUD | `/api/admin/service-posts` | Gestão da galeria |
| CRUD | `/api/admin/appointments` | Gestão de agendamentos |
| CRUD | `/api/admin/offered-services` | Gestão de serviços |
| PUT | `/api/admin/site-settings` | Atualiza configurações |

---

## Migrações de Banco de Dados

O projeto utiliza Drizzle ORM com sistema de migrações programáticas.

### Como Funciona

1. As migrações são armazenadas em `/migrations/`
2. O servidor executa migrações automaticamente ao iniciar
3. Bancos existentes são detectados e a migração baseline é marcada como aplicada
4. Apenas migrações pendentes são executadas

### Gerar Nova Migração

Após alterar o schema em `shared/schema.ts`:

```bash
npx drizzle-kit generate
```

Isso criará um novo arquivo SQL em `/migrations/` com as alterações.

### Aplicar Migrações Manualmente

```bash
npx drizzle-kit migrate
```

### Desenvolvimento Rápido (Push Direto)

Para desenvolvimento local sem gerar arquivos de migração:

```bash
npm run db:push
```

### Visualizar Banco de Dados

```bash
npx drizzle-kit studio
```

---

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia servidor de desenvolvimento (porta 5000)

# Build e Produção
npm run build         # Compila frontend e backend
npm run start         # Inicia servidor de produção

# Banco de Dados
npm run db:push       # Aplica schema diretamente (dev rápido)
npx drizzle-kit generate  # Gera nova migração SQL
npx drizzle-kit migrate   # Aplica migrações pendentes
npx drizzle-kit studio    # Interface visual do banco

# Qualidade
npm run check         # Verifica tipos TypeScript
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão PostgreSQL |
| `SESSION_SECRET` | Não | Chave para sessões (gerada automaticamente) |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Não | ID do bucket para uploads |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Não | Caminhos públicos do storage |
| `PRIVATE_OBJECT_DIR` | Não | Diretório privado do storage |

---

## Design System

### Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Primary (Yellow) | `#eab308` | CTAs, destaques, links |
| Background | `#0a0a0a` | Fundo principal |
| Card | `#171717` | Cards e containers |
| Border | `#262626` | Bordas e separadores |
| Text | `#fafafa` | Texto principal |
| Muted | `#a1a1aa` | Texto secundário |

### Tipografia

- **Display**: Oxanium (títulos, logo, preços)
- **Body**: Inter (texto, UI, forms)

### Breakpoints

| Tamanho | Largura | Dispositivo |
|---------|---------|-------------|
| sm | 640px | Smartphones |
| md | 768px | Tablets |
| lg | 1024px | Desktop |
| xl | 1280px | Desktop grande |

### Componentes Base

- Bordas arredondadas: `rounded-lg` (8px)
- Sombras: Mínimas, foco em bordas
- Transições: 150-200ms ease
- Estados: hover, focus, disabled com opacidade

---

## Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request
