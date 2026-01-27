# Daniel Valente Moto Detalhamento

Site e-commerce para negócio de detalhamento de motocicletas, com catálogo de produtos, checkout via WhatsApp, sistema de agendamento de serviços e painel administrativo completo.

## Funcionalidades

### Para Clientes
- **Catálogo de Produtos** - Navegue por produtos de detalhamento com imagens, descrições, preços e avaliações
- **Carrinho de Compras** - Adicione produtos, ajuste quantidades e finalize via WhatsApp
- **Sistema de Avaliações** - Avalie produtos após a compra
- **Agendamento de Serviços** - Solicite pré-agendamentos para serviços de detalhamento
- **Conta do Cliente** - Cadastro, login, histórico de pedidos e gerenciamento de perfil
- **Galeria de Trabalhos** - Veja exemplos de serviços realizados com fotos e vídeos

### Para Administradores
- **Dashboard** - Visão geral de pedidos, clientes e métricas
- **Gestão de Produtos** - Cadastro, edição e exclusão de produtos com upload de imagens
- **Gestão de Pedidos** - Acompanhe e atualize status dos pedidos
- **Gestão de Clientes** - Visualize e gerencie clientes cadastrados
- **Gestão de Usuários** - Controle de acesso de administradores
- **Serviços Prestados** - Cadastre os serviços oferecidos com preços aproximados
- **Galeria de Serviços** - Adicione trabalhos realizados com fotos e vídeos do YouTube
- **Agenda de Serviços** - Gerencie agendamentos com calendário visual
- **Configurações do Site** - Personalize textos, logo, imagem de fundo, redes sociais e endereço

## Stack Tecnológica

### Frontend
- **React 19** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS v4** para estilização
- **shadcn/ui** com componentes Radix UI
- **TanStack React Query** para gerenciamento de estado do servidor
- **Wouter** para roteamento
- **Lucide React** para ícones

### Backend
- **Express.js 5** com TypeScript
- **PostgreSQL** com Drizzle ORM
- **Autenticação** baseada em sessões com scrypt
- **Object Storage** integrado para upload de arquivos

### Integrações
- **WhatsApp Business** - Checkout e notificações
- **Resend** - Envio de emails
- **Google Fonts** - Oxanium (títulos) e Inter (texto)
- **YouTube** - Embed de vídeos na galeria

## Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/            # Utilitários e API client
│   │   └── hooks/          # Custom hooks
├── server/                 # Backend Express
│   ├── index.ts            # Setup do servidor
│   ├── routes.ts           # Rotas da API
│   └── storage.ts          # Camada de acesso ao banco
├── shared/                 # Código compartilhado
│   └── schema.ts           # Schemas Drizzle/Zod
└── db/                     # Configuração do banco de dados
```

## Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build de produção
npm run start     # Inicia servidor de produção
npm run db:push   # Aplica migrations do banco
npm run check     # Verifica tipos TypeScript
```

## Variáveis de Ambiente

- `DATABASE_URL` - URL de conexão do PostgreSQL
- `SESSION_SECRET` - Chave secreta para sessões (gerado automaticamente)

## Design

- **Tema**: Dark tech com preto/cinza escuro
- **Cor primária**: Amarelo dourado (#eab308)
- **Tipografia**: Oxanium (display) + Inter (UI)
- **Responsivo**: Otimizado para mobile e desktop

## Licença

MIT
