/**
 * Seed file - Dados extraídos da base de produção
 * Gerado em: 2026-02-07
 * 
 * USO:
 *   npx tsx seed.ts
 * 
 * IMPORTANTE:
 *   - Este script insere dados nas tabelas do banco conectado via DATABASE_URL
 *   - Tabelas com dados existentes serão ignoradas (ON CONFLICT DO NOTHING)
 *   - Senhas de usuários precisam ser definidas manualmente após o seed
 *   - As URLs de imagens apontam para o Object Storage original
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL não definida. Configure a variável de ambiente.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("Iniciando seed da base de dados...\n");

  // ============================================================
  // 1. SITE SETTINGS
  // ============================================================
  console.log("→ Inserindo configurações do site...");
  const siteData = {
    id: 1,
    whatsappNumber: "+55 53 981047948",
    siteName: "Daniel Valente",
    siteTagline: "Tudo que sua máquina merece em detalhamento automotivo , você encontra aqui .",
    heroTitle: "Produtos  Para Detalhamento",
    heroTitleLine2: "Premium",
    heroSubtitle: "Cuidado profissional para seu carro ou moto. Utilizamos e vendemos apenas os melhores produtos do mercado mundial.",
    footerText: "Daniel Valente Moto Detalhamento\nLoja especializada na venda de produtos automotivos para estética automotiva e lavagens, trabalhando com as melhores marcas e produtos do mercado. Além disso, oferecemos serviço de detalhamento premium em motocicletas, unindo qualidade, técnica e alto padrão de acabamento.",
    copyrightText: "© 2026 Daniel Valente Moto Detalhamento. Todos os direitos reservados.",
    logoImage: "/objects/uploads/8b045942-99e9-4967-96a0-12f986c903cb",
    backgroundImage: "/objects/uploads/9797a2e7-1b7d-42ba-8140-217a7a87c187",
    businessAddress: "Daniel Valente Moto Detalhamento, R. Dr. Amarante, 1289 - Centro, Pelotas - RS, 96020-720",
    instagramUrl: "https://www.instagram.com/danielvalenteprodutos/",
    facebookUrl: "",
    youtubeUrl: "",
  };
  await db.execute(
    sql`INSERT INTO site_settings (id, whatsapp_number, site_name, site_tagline, hero_title, hero_title_line2, hero_subtitle, footer_text, copyright_text, logo_image, background_image, business_address, instagram_url, facebook_url, youtube_url)
        VALUES (${siteData.id}, ${siteData.whatsappNumber}, ${siteData.siteName}, ${siteData.siteTagline}, ${siteData.heroTitle}, ${siteData.heroTitleLine2}, ${siteData.heroSubtitle}, ${siteData.footerText}, ${siteData.copyrightText}, ${siteData.logoImage}, ${siteData.backgroundImage}, ${siteData.businessAddress}, ${siteData.instagramUrl}, ${siteData.facebookUrl}, ${siteData.youtubeUrl})
        ON CONFLICT DO NOTHING`
  );
  console.log("  ✓ Configurações do site inseridas\n");

  // ============================================================
  // 2. PRODUCTS
  // ============================================================
  console.log("→ Inserindo produtos...");
  const productData = [
    {
      id: 1,
      name: "Teste",
      description: "produto teste que resolve tudo",
      price: 145,
      image: "/objects/uploads/96407282-d835-43cc-a199-1b6a56d3de0f",
      category: "Proteção",
      inStock: true,
      images: [] as string[],
      createdAt: new Date("2026-01-26T12:16:38.356Z"),
    },
    {
      id: 2,
      name: "Lava Auto V Floc  Vonixx",
      description: "V-Floc é um lava autos de alta performance e de pH neutro. Sua fórmula contém agentes condicionadores e tensoativos especiais que proporcionam uma lavagem suave e eficiente. V-Floc tem alto grau de lubrificação, promovendo redução significativa do coeficiente de atrito, proporcionando um melhor deslize da luva microfibra e reduzindo de forma efetiva as chances de microrriscos na pintura. V-Floc também promove brilho e aspecto de renovação da pintura.",
      price: 25,
      image: "/objects/uploads/49ac1dc8-3ce7-4fae-984d-b4f9a74fd0d7",
      category: "Lava Autos",
      inStock: true,
      images: [
        "/objects/uploads/99367266-428c-4e41-8cd9-91fabb6ba441",
        "/objects/uploads/9deb0d35-1af9-4628-bc9a-3c2e443f36a5",
      ],
      createdAt: new Date("2026-01-27T15:33:41.022Z"),
    },
    {
      id: 9,
      name: "lava auto moto- V  Vonixx",
      description: `Moto-V é um lava-motos, desenvolvido para limpeza de alta eficiência. Sua formulação equilibrada permite uso, sem agredir, em todas as partes da motocicleta, seja motor, pintura, metais ou plásticos. As possíveis diluições do produto proporcionam ao mesmo a remoção dos mais diversos tipos de sujeira, como barro, lama, graxa e óleo.

Diluição
Remoção de graxa e óleo - Até 1:10
Lavagem diária da pintura - Até 1:20
Remoção de barro e lama - Até 1:50

-Remove barro e lama
-Poder desengraxante`,
      price: 65,
      image: "/objects/uploads/ca6da495-1518-4cdb-9afa-215a63590199",
      category: "Lava Autos",
      inStock: true,
      images: [] as string[],
      createdAt: new Date("2026-01-27T19:27:04.602Z"),
    },
    {
      id: 11,
      name: "Lava auto Vintex ",
      description: `O Lava Autos é um produto que foi desenvolvido para limpar, proteger e conservar a lataria do veículo. Por possuir pH neutro, pode ser aplicado em qualquer superfície sem correr o risco de danificá-la.

-Limpa protege e dá brilho
-pH neutro
-Pode ser aplicado em qualquer superfície

Modo de usar
1. Dilua o produto na concentração de 100ml para cada 5L de água e, com o auxílio de uma luva de microfibra, comece a lavar o veículo pelas partes mais altas e depois as mais baixas
2. Enxágue em seguida até remover toda a espuma
3. Para melhor resultado, seque o veículo com a toalha de secagem`,
      price: 21,
      image: "/objects/uploads/ab003d14-2139-4c40-b107-01ec9ed4b83d",
      category: "Lava Autos",
      inStock: true,
      images: [
        "/objects/uploads/2cc05a7b-58f8-4a72-993f-7f82641a7cfe",
        "/objects/uploads/0251cd0c-2527-47e1-847e-8bc69ab252eb",
      ],
      createdAt: new Date("2026-01-27T19:31:43.454Z"),
    },
    {
      id: 21,
      name: "LAVA AUTO V MOL VONIXX",
      description: `V-Mol é um lava autos biodegradável com pH levemente básico que não agride a superfície. Ideal para  lavagem de automóveis, em especial para remoção de sujeiras mais difíceis, como remoção de barro e óleo. Agora com aroma cereja intensa!`,
      price: 20,
      image: "/objects/uploads/faf1d77b-1d07-4f5f-9239-4afe39af7d61",
      category: "Lava Autos",
      inStock: true,
      images: ["/objects/uploads/2f0b871d-d58d-4295-8bff-340b9522b9be"],
      createdAt: new Date("2026-02-05T19:15:16.018Z"),
    },
    {
      id: 23,
      name: "LAVA AUTO DETMOL SANDET",
      description: `O Det Mol da Sandet é um detergente desengraxante desenvolvido para limpeza pesada em diversas superfícies.

Sua fórmula inovadora remove sujeiras difíceis como graxa, óleo, lama e outras sujidades incrustadas, sem danificar a pintura ou oxidar as peças.

É ideal para limpeza de veículos pesados e de passeio, chassis, máquinas, pisos, paredes e equipamentos em geral.

Com alta capacidade de diluição, o Det Mol garante um excelente rendimento, tornando a limpeza mais econômica e eficiente.`,
      price: 30,
      image: "/objects/uploads/eddc0ff3-a4f9-48df-b426-634cd00aa7e4",
      category: "Lava Autos",
      inStock: true,
      images: [] as string[],
      createdAt: new Date("2026-02-05T19:19:52.902Z"),
    },
    {
      id: 24,
      name: "LAVA AUTO CITRON 1,5 VONIXX",
      description: `Sua poderosa fórmula combina tensoativos especiais e solventes naturais extraídos cuidadosamente de cascas de laranja. Com uma ação de lavagem pesada, Citron é a escolha ideal para eliminar graxa, matéria orgânica e ceras, proporcionando uma limpeza profunda e impecável à pintura do seu automóvel.`,
      price: 45.9,
      image: "/objects/uploads/64d3a465-4925-4684-bed1-a59762d84913",
      category: "Lava Autos",
      inStock: true,
      images: ["/objects/uploads/853c9daa-4c52-4d11-9c78-c721c201bd79"],
      createdAt: new Date("2026-02-05T19:23:07.983Z"),
    },
  ];

  for (const p of productData) {
    const imagesLiteral = p.images.length > 0
      ? `{${p.images.map((i: string) => `"${i}"`).join(",")}}`
      : "{}";
    await db.execute(
      sql`INSERT INTO products (id, name, description, price, image, category, in_stock, images, created_at)
          VALUES (${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.image}, ${p.category}, ${p.inStock}, ${imagesLiteral}::text[], ${p.createdAt})
          ON CONFLICT DO NOTHING`
    );
  }
  await db.execute(sql`SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))`);
  console.log(`  ✓ ${productData.length} produtos inseridos\n`);

  // ============================================================
  // 3. PRODUCT VARIATIONS
  // ============================================================
  console.log("→ Inserindo variações de produtos...");
  const variationData = [
    { id: 1, productId: 11, label: "1,5", price: 21, inStock: true, createdAt: new Date("2026-01-30T16:02:31.121Z") },
    { id: 4, productId: 2, label: "240 ml", price: 18, inStock: true, createdAt: new Date("2026-01-30T17:06:07.721Z") },
    { id: 5, productId: 2, label: "500 ml", price: 25, inStock: true, createdAt: new Date("2026-01-30T17:06:13.704Z") },
    { id: 6, productId: 2, label: "1,5 lts", price: 52, inStock: true, createdAt: new Date("2026-01-30T17:06:21.805Z") },
    { id: 7, productId: 2, label: "3 lts", price: 85, inStock: true, createdAt: new Date("2026-01-30T17:06:34.142Z") },
    { id: 8, productId: 2, label: "5 lts", price: 125, inStock: true, createdAt: new Date("2026-01-30T17:06:41.397Z") },
    { id: 9, productId: 9, label: "500 ml", price: 35, inStock: true, createdAt: new Date("2026-01-30T21:51:49.798Z") },
    { id: 10, productId: 9, label: "1,5 lts", price: 65, inStock: true, createdAt: new Date("2026-01-30T21:51:58.284Z") },
    { id: 11, productId: 11, label: "5 lts", price: 59, inStock: true, createdAt: new Date("2026-01-30T22:17:22.028Z") },
    { id: 12, productId: 11, label: "500 ml", price: 12, inStock: true, createdAt: new Date("2026-01-30T22:17:36.514Z") },
    { id: 13, productId: 21, label: "500 ML", price: 20, inStock: true, createdAt: new Date("2026-02-05T19:15:28.651Z") },
    { id: 14, productId: 21, label: "1,5 LTS", price: 38, inStock: true, createdAt: new Date("2026-02-05T19:15:56.399Z") },
    { id: 15, productId: 21, label: "5 LTS", price: 106, inStock: true, createdAt: new Date("2026-02-05T19:16:09.113Z") },
    { id: 16, productId: 23, label: "1LT", price: 30, inStock: true, createdAt: new Date("2026-02-05T19:20:32.130Z") },
    { id: 17, productId: 23, label: "5 LTS", price: 91, inStock: true, createdAt: new Date("2026-02-05T19:20:39.725Z") },
  ];

  for (const v of variationData) {
    await db.execute(
      sql`INSERT INTO product_variations (id, product_id, label, price, in_stock, created_at)
          VALUES (${v.id}, ${v.productId}, ${v.label}, ${v.price}, ${v.inStock}, ${v.createdAt})
          ON CONFLICT DO NOTHING`
    );
  }
  await db.execute(sql`SELECT setval('product_variations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM product_variations))`);
  console.log(`  ✓ ${variationData.length} variações inseridas\n`);

  // ============================================================
  // 4. USERS (senhas precisam ser redefinidas)
  // ============================================================
  console.log("→ Inserindo usuários...");
  console.log("  ⚠ ATENÇÃO: Senhas serão definidas como 'trocar123' - altere após o seed!\n");

  const userData = [
    { id: "a13d9fbc-b170-470e-82ba-f382e7a98615", username: "v4lente@gmail.com", role: "admin", createdAt: new Date("2026-01-24T17:56:34.530Z") },
    { id: "8c3b9bf8-0217-4cb0-ad30-e2e607e29a76", username: "suelen", role: "admin", createdAt: new Date("2026-01-24T18:11:11.337Z") },
    { id: "b963705e-fce8-4411-87fd-ac2c989f7777", username: "David", role: "viewer", createdAt: new Date("2026-01-24T18:11:32.158Z") },
    { id: "7bc3f811-9363-4afe-a519-36358f23442c", username: "daniel", role: "admin", createdAt: new Date("2026-01-24T18:13:00.286Z") },
  ];

  const defaultPassword = await hashPassword("trocar123");

  for (const u of userData) {
    await db.execute(
      sql`INSERT INTO users (id, username, password, role, created_at)
          VALUES (${u.id}, ${u.username}, ${defaultPassword}, ${u.role}, ${u.createdAt})
          ON CONFLICT DO NOTHING`
    );
  }
  console.log(`  ✓ ${userData.length} usuários inseridos\n`);

  // ============================================================
  // 5. CUSTOMERS
  // ============================================================
  console.log("→ Inserindo clientes...");
  const customerData = [
    {
      id: "6901c78b-1424-414b-ace4-1dba6189ee8c",
      email: "sufeijo@gmail.com",
      phone: "53981047948",
      name: "Suelen ",
      nickname: null as string | null,
      deliveryAddress: "Dr Amarante 1289",
      password: null as string | null,
      isRegistered: false,
      createdAt: new Date("2026-01-27T15:47:36.567Z"),
    },
    {
      id: "0acd2e68-b946-482b-b063-b10c5b51faf1",
      email: null as string | null,
      phone: "53 981116072",
      name: "SUELEN",
      nickname: null as string | null,
      deliveryAddress: null as string | null,
      password: null as string | null,
      isRegistered: false,
      createdAt: new Date("2026-01-28T14:21:59.789Z"),
    },
    {
      id: "af21f055-afa6-46ae-895b-5d1573bed70f",
      email: null as string | null,
      phone: "55 53 981116072",
      name: "SUELEN",
      nickname: null as string | null,
      deliveryAddress: null as string | null,
      password: null as string | null,
      isRegistered: false,
      createdAt: new Date("2026-01-28T14:22:35.746Z"),
    },
    {
      id: "c2340f31-a0b8-4911-ab14-6cc895f89431",
      email: "v4lente@gmail.com",
      phone: "47996560228",
      name: "David",
      nickname: null as string | null,
      deliveryAddress: "Avenida Independência, 1840\napto 102",
      password: null as string | null,
      isRegistered: false,
      createdAt: new Date("2026-02-05T19:40:07.892Z"),
    },
  ];

  for (const c of customerData) {
    await db.execute(
      sql`INSERT INTO customers (id, email, phone, name, nickname, delivery_address, password, is_registered, created_at)
          VALUES (${c.id}, ${c.email}, ${c.phone}, ${c.name}, ${c.nickname}, ${c.deliveryAddress}, ${c.password}, ${c.isRegistered}, ${c.createdAt})
          ON CONFLICT DO NOTHING`
    );
  }
  console.log(`  ✓ ${customerData.length} clientes inseridos\n`);

  // ============================================================
  // 6. ORDERS
  // ============================================================
  console.log("→ Inserindo pedidos...");
  const orderData = [
    {
      id: 1,
      customerId: "6901c78b-1424-414b-ace4-1dba6189ee8c",
      status: "pending",
      total: 25,
      customerName: "Suelen ",
      customerPhone: "53981047948",
      customerEmail: "sufeijo@gmail.com",
      deliveryAddress: "Dr Amarante 1289",
      whatsappMessage: `🏍️ *Novo Pedido*\n\n*Cliente:* Suelen \n*Telefone:* 53981047948\n*Email:* sufeijo@gmail.com\n*Endereço:* Dr Amarante 1289\n\n*Itens:*\n• 1x Lava Auto V Floc Vonixx 500 ml  - R$ 25.00\n\n*Total: R$ 25.00*`,
      createdAt: new Date("2026-01-27T15:47:36.617Z"),
    },
    {
      id: 2,
      customerId: "0acd2e68-b946-482b-b063-b10c5b51faf1",
      status: "pending",
      total: 21,
      customerName: "SUELEN",
      customerPhone: "53 981116072",
      customerEmail: null as string | null,
      deliveryAddress: null as string | null,
      whatsappMessage: `🏍️ *Novo Pedido*\n\n*Cliente:* SUELEN\n*Telefone:* 53 981116072\n\n*Itens:*\n• 1x Lava auto 1,5 lts Vintex - R$ 21.00\n\n*Total: R$ 21.00*`,
      createdAt: new Date("2026-01-28T14:21:59.839Z"),
    },
    {
      id: 3,
      customerId: "af21f055-afa6-46ae-895b-5d1573bed70f",
      status: "pending",
      total: 21,
      customerName: "SUELEN",
      customerPhone: "55 53 981116072",
      customerEmail: null as string | null,
      deliveryAddress: null as string | null,
      whatsappMessage: `🏍️ *Novo Pedido*\n\n*Cliente:* SUELEN\n*Telefone:* 55 53 981116072\n\n*Itens:*\n• 1x Lava auto 1,5 lts Vintex - R$ 21.00\n\n*Total: R$ 21.00*`,
      createdAt: new Date("2026-01-28T14:22:35.794Z"),
    },
    {
      id: 4,
      customerId: "c2340f31-a0b8-4911-ab14-6cc895f89431",
      status: "pending",
      total: 145,
      customerName: "David",
      customerPhone: "47996560228",
      customerEmail: "v4lente@gmail.com",
      deliveryAddress: "Avenida Independência, 1840\napto 102",
      whatsappMessage: `🏍️ *Novo Pedido*\n\n*Cliente:* David\n*Telefone:* 47996560228\n*Email:* v4lente@gmail.com\n*Endereço:* Avenida Independência, 1840\napto 102\n\n*Itens:*\n• 1x Teste - R$ 145.00\n\n*Total: R$ 145.00*`,
      createdAt: new Date("2026-02-05T19:40:07.938Z"),
    },
  ];

  let ordersInserted = 0;
  for (const o of orderData) {
    try {
      await db.execute(
        sql`INSERT INTO orders (id, customer_id, status, total, customer_name, customer_phone, customer_email, delivery_address, whatsapp_message, created_at)
            VALUES (${o.id}, ${o.customerId}, ${o.status}, ${o.total}, ${o.customerName}, ${o.customerPhone}, ${o.customerEmail}, ${o.deliveryAddress}, ${o.whatsappMessage}, ${o.createdAt})
            ON CONFLICT DO NOTHING`
      );
      ordersInserted++;
    } catch (err: any) {
      console.log(`  ⚠ Pedido #${o.id} ignorado (${err.detail || err.message})`);
    }
  }
  await db.execute(sql`SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders))`);
  console.log(`  ✓ ${ordersInserted}/${orderData.length} pedidos inseridos\n`);

  // ============================================================
  // 7. ORDER ITEMS
  // ============================================================
  console.log("→ Inserindo itens de pedidos...");
  const orderItemData = [
    { id: 1, orderId: 1, productId: 2, productName: "Lava Auto V Floc Vonixx 500 ml ", productPrice: 25, quantity: 1 },
    { id: 2, orderId: 2, productId: 11, productName: "Lava auto 1,5 lts Vintex", productPrice: 21, quantity: 1 },
    { id: 3, orderId: 3, productId: 11, productName: "Lava auto 1,5 lts Vintex", productPrice: 21, quantity: 1 },
    { id: 4, orderId: 4, productId: 1, productName: "Teste", productPrice: 145, quantity: 1 },
  ];

  let itemsInserted = 0;
  for (const oi of orderItemData) {
    try {
      await db.execute(
        sql`INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity)
            VALUES (${oi.id}, ${oi.orderId}, ${oi.productId}, ${oi.productName}, ${oi.productPrice}, ${oi.quantity})
            ON CONFLICT DO NOTHING`
      );
      itemsInserted++;
    } catch (err: any) {
      console.log(`  ⚠ Item #${oi.id} ignorado (${err.detail || err.message})`);
    }
  }
  await db.execute(sql`SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items))`);
  console.log(`  ✓ ${itemsInserted}/${orderItemData.length} itens de pedidos inseridos\n`);

  // ============================================================
  // RESUMO
  // ============================================================
  console.log("═══════════════════════════════════════════");
  console.log("  SEED CONCLUÍDO COM SUCESSO!");
  console.log("═══════════════════════════════════════════");
  console.log(`  • ${productData.length} produtos`);
  console.log(`  • ${variationData.length} variações`);
  console.log(`  • ${userData.length} usuários (senha padrão: trocar123)`);
  console.log(`  • ${customerData.length} clientes`);
  console.log(`  • ${ordersInserted}/${orderData.length} pedidos`);
  console.log(`  • ${itemsInserted}/${orderItemData.length} itens de pedidos`);
  console.log(`  • 1 configuração do site`);
  console.log("");
  console.log("  Tabelas vazias na produção (não seedadas):");
  console.log("    - reviews, service_posts, offered_services, appointments");
  console.log("");
  console.log("  ⚠ LEMBRE-SE: Altere as senhas dos usuários após o seed!");
  console.log("  ⚠ As imagens dependem do Object Storage original.");
  console.log("  ⚠ Pedidos/itens podem ser ignorados se clientes já existirem");
  console.log("    com IDs diferentes (conflito de email/telefone).");
  console.log("═══════════════════════════════════════════\n");

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro durante o seed:", err);
  process.exit(1);
});
