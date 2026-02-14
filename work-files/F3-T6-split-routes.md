# F3-T6 - Quebrar routes.ts em Modulos por Dominio

## Metadata
- **ID**: F3-T6
- **Fase**: 3 - Migracao do Backend
- **Status**: pendente
- **Responsavel**: 
- **Data Inicio**: 
- **Data Conclusao**: 

## Descricao
Quebrar o arquivo monolitico `routes.ts` (1580 linhas) em modulos por dominio.

## Checklist
- [ ] Criar `backend/api/routes/auth.routes.ts` (~300 linhas)
- [ ] Criar `backend/api/routes/products.routes.ts` (~350 linhas)
- [ ] Criar `backend/api/routes/orders.routes.ts` (~250 linhas)
- [ ] Criar `backend/api/routes/appointments.routes.ts` (~150 linhas)
- [ ] Criar `backend/api/routes/services.routes.ts` (~200 linhas)
- [ ] Criar `backend/api/routes/customers.routes.ts` (~150 linhas)
- [ ] Criar `backend/api/routes/users.routes.ts` (~100 linhas)
- [ ] Criar `backend/api/routes/uploads.routes.ts` (~50 linhas)
- [ ] Criar `backend/api/routes/settings.routes.ts` (~30 linhas)
- [ ] Criar `backend/api/routes/index.ts` (registra todas as rotas)
- [ ] Extrair middlewares para `backend/api/middleware/auth.ts`
- [ ] Remover `routes.ts` original

## Estrutura Alvo
```
backend/api/
  routes/
    index.ts              # Registra todas as rotas
    auth.routes.ts        # Admin + Customer auth
    products.routes.ts    # CRUD produtos + variacoes + reviews
    orders.routes.ts      # Orders + checkout + stripe webhooks
    appointments.routes.ts
    services.routes.ts    # Offered services + service posts
    customers.routes.ts   # Admin CRUD clientes
    users.routes.ts       # Admin CRUD usuarios
    uploads.routes.ts
    settings.routes.ts
  middleware/
    auth.ts               # requireAuth, requireAdmin, requireCustomerAuth
```

## Rotas por Modulo

### auth.routes.ts
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/customer/register`
- POST `/api/customer/login`
- POST `/api/customer/logout`
- GET `/api/customer/me`

### products.routes.ts
- GET/POST `/api/products`
- GET/PUT/DELETE `/api/products/:id`
- GET/POST `/api/products/:id/variations`
- PUT/DELETE `/api/products/:id/variations/:variationId`
- GET/POST `/api/products/:id/reviews`

### orders.routes.ts
- GET/POST `/api/orders`
- GET/PUT `/api/orders/:id`
- POST `/api/checkout`
- POST `/api/checkout/create-session`
- POST `/api/webhooks/stripe`

### appointments.routes.ts
- GET/POST `/api/appointments`
- GET/PUT/DELETE `/api/appointments/:id`

### services.routes.ts
- GET/POST `/api/offered-services`
- GET/PUT/DELETE `/api/offered-services/:id`
- GET/POST `/api/service-posts`
- GET/PUT/DELETE `/api/service-posts/:id`

### customers.routes.ts
- GET/POST `/api/customers`
- GET/PUT/DELETE `/api/customers/:id`

### users.routes.ts
- GET/POST `/api/users`
- GET/PUT/DELETE `/api/users/:id`

### uploads.routes.ts
- POST `/api/uploads/local`

### settings.routes.ts
- GET/PUT `/api/settings`

## Criterio de Aceite
- Todos os modulos criados
- Cada modulo < 400 linhas
- Todas as rotas funcionando
- `routes.ts` original removido
- Smoke tests passando

## Dependencias
- F3-T5 (extrair auth utils)

## Pode Ser Dividida em Paralelo
- Stream 1: `auth.routes.ts` + `customers.routes.ts`
- Stream 2: `products.routes.ts`
- Stream 3: `orders.routes.ts`
- Stream 4: `appointments.routes.ts` + `services.routes.ts`
- Stream 5: `users.routes.ts` + `uploads.routes.ts` + `settings.routes.ts`

## Notas
- Esta e a task mais trabalhosa da Fase 3
- Testar cada modulo isoladamente antes de integrar

---

## Historico de Status
| Data | Status | Responsavel | Observacao |
|------|--------|-------------|------------|
| | pendente | | Task criada |
