/**
 * Script de seed para produção (Node puro, sem tsx).
 * 
 * USO:
 *   node --env-file=.env scripts/run-seed.mjs              # Insere dados (não sobrescreve existentes)
 *   node --env-file=.env scripts/run-seed.mjs --if-empty   # Só insere se banco estiver vazio (deploy)
 *   node --env-file=.env scripts/run-seed.mjs --fresh      # Limpa TODAS as tabelas e insere do zero
 * 
 * IMPORTANTE:
 *   - As senhas dos usuários são os hashes reais de produção (logins preservados)
 *   - As imagens estão em public/uploads/ (pasta local portátil)
 *   - Para migrar para outro ambiente: copie public/uploads/ + rode este seed
 *   - Ordem de inserção respeita foreign keys
 *   - AUTO_INCREMENT é resetado automaticamente
 */

import mysql from "mysql2/promise";

const FRESH_MODE = process.argv.includes("--fresh");
const IF_EMPTY_MODE = process.argv.includes("--if-empty");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("⚠ DATABASE_URL não definida. Pulando seed.");
    console.log("  Configure a variável de ambiente DATABASE_URL para aplicar seed.");
    return;
  }

  let pool;
  let connection;

  try {
    pool = mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
    });

    connection = await pool.getConnection();

    // ============================================================
    // MODO --if-empty: Verificar se banco já tem dados
    // ============================================================
    if (IF_EMPTY_MODE) {
      console.log("🔍 Verificando se banco precisa de seed...");
      
      try {
        const [rows] = await connection.query("SELECT COUNT(*) as count FROM site_settings");
        const count = rows[0]?.count || 0;
        
        if (count > 0) {
          console.log("✓ Banco já possui dados. Pulando seed.");
          console.log("  (Use --fresh para limpar e reinserir dados)\n");
          return;
        }
        
        console.log("  Banco vazio detectado. Aplicando seed inicial...\n");
      } catch (error) {
        // Tabela pode não existir ainda (migrations não rodaram)
        if (error.code === "ER_NO_SUCH_TABLE") {
          console.log("⚠ Tabela site_settings não existe. Migrations podem não ter rodado.");
          console.log("  Pulando seed (execute migrations primeiro).\n");
          return;
        }
        throw error;
      }
    }

    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  SEED - Daniel Valente Moto Detalhamento      ║");
    console.log(`║  Modo: ${FRESH_MODE ? "FRESH (limpar e inserir)" : IF_EMPTY_MODE ? "IF-EMPTY (deploy)" : "INSERÇÃO (preservar)"}       ║`);
    console.log("║  Banco: MySQL/MariaDB                          ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    await connection.beginTransaction();

    // ============================================================
    // MODO FRESH: Limpar todas as tabelas na ordem correta (FK)
    // ============================================================
    if (FRESH_MODE) {
      console.log("🗑️  Limpando todas as tabelas...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("DELETE FROM order_items");
      await connection.query("DELETE FROM orders");
      await connection.query("DELETE FROM reviews");
      await connection.query("DELETE FROM appointments");
      await connection.query("DELETE FROM offered_services");
      await connection.query("DELETE FROM service_post_media");
      await connection.query("DELETE FROM service_posts");
      await connection.query("DELETE FROM product_variations");
      await connection.query("DELETE FROM product_images");
      await connection.query("DELETE FROM products");
      await connection.query("DELETE FROM customers");
      await connection.query("DELETE FROM users");
      await connection.query("DELETE FROM site_settings");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("  ✓ Todas as tabelas limpas\n");
    }

    // ============================================================
    // 1. SITE SETTINGS
    // ============================================================
    console.log("→ Configurações do site...");
    await connection.query(`
      INSERT INTO site_settings (id, whatsapp_number, site_name, site_tagline, hero_title, hero_title_line2, hero_subtitle, footer_text, copyright_text, logo_image, background_image, business_address, instagram_url, facebook_url, youtube_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        whatsapp_number = VALUES(whatsapp_number),
        site_name = VALUES(site_name),
        site_tagline = VALUES(site_tagline),
        hero_title = VALUES(hero_title),
        hero_title_line2 = VALUES(hero_title_line2),
        hero_subtitle = VALUES(hero_subtitle),
        footer_text = VALUES(footer_text),
        copyright_text = VALUES(copyright_text),
        logo_image = VALUES(logo_image),
        background_image = VALUES(background_image),
        business_address = VALUES(business_address),
        instagram_url = VALUES(instagram_url),
        facebook_url = VALUES(facebook_url),
        youtube_url = VALUES(youtube_url)
    `, [
      1,
      "+55 53 981047948",
      "Daniel Valente",
      "Tudo que sua máquina merece em detalhamento automotivo , você encontra aqui .",
      "Produtos  Para Detalhamento",
      "Premium",
      "Cuidado profissional para seu carro ou moto. Utilizamos e vendemos apenas os melhores produtos do mercado mundial.",
      "Daniel Valente Moto Detalhamento\nLoja especializada na venda de produtos automotivos para estética automotiva e lavagens, trabalhando com as melhores marcas e produtos do mercado. Além disso, oferecemos serviço de detalhamento premium em motocicletas, unindo qualidade, técnica e alto padrão de acabamento.",
      "© 2026 Daniel Valente Moto Detalhamento. Todos os direitos reservados.",
      "/uploads/8b045942-99e9-4967-96a0-12f986c903cb.jpg",
      "/uploads/9797a2e7-1b7d-42ba-8140-217a7a87c187.jpg",
      "Daniel Valente Moto Detalhamento, R. Dr. Amarante, 1289 - Centro, Pelotas - RS, 96020-720",
      "https://www.instagram.com/danielvalenteprodutos/",
      "",
      "",
    ]);
    console.log("  ✓ 1 configuração inserida\n");

    // ============================================================
    // 2. USERS (hashes reais de produção - logins preservados)
    // ============================================================
    console.log("→ Usuários...");
    const users = [
      {
        id: "a13d9fbc-b170-470e-82ba-f382e7a98615",
        username: "v4lente@gmail.com",
        password: "952bfb089c3b459df702f8cf1808775c211db168026e0d3d6b7ae6f9bf07a44244c8c49e562924565ec2b911e34597e2a2d381e605a10663ecf581c6d39075fa.032f96f25d6cf73aa9ff802058523699",
        role: "admin",
        created_at: "2026-01-24T17:56:34.530Z",
      },
      {
        id: "8c3b9bf8-0217-4cb0-ad30-e2e607e29a76",
        username: "suelen",
        password: "807b11628174425a25dc5aca0a05043353833ba5036dd1ec4429aa798bb49cc8ca78b5aac810dd8fed1b415c94358f02096a5fabfa92971bf1cd2cdf267a8128.f6dac76f0a963a9bc9940f3b777100d8",
        role: "admin",
        created_at: "2026-01-24T18:11:11.337Z",
      },
      {
        id: "b963705e-fce8-4411-87fd-ac2c989f7777",
        username: "David",
        password: "206b77c1fe9a6131434e4439a26e37b60286a780684551e2f5e65ddd41c8d2b3aafe92c1ff1d1381fdc0fc395fa13f28b40bda4052f1ea2ca97441e49730fea8.5654b35e64b85399a92854b2a2a2be04",
        role: "viewer",
        created_at: "2026-01-24T18:11:32.158Z",
      },
      {
        id: "7bc3f811-9363-4afe-a519-36358f23442c",
        username: "daniel",
        password: "1fad67ce5331b3f450e36b2d6b70d236661f15987601dfd3a304194a2ce7d18a3cd5ae78a444bb5aa2489a8624d986d30712c56894f26c7cb111fa09da0ec39d.2b0b6b356644ee9982c6d42572361a81",
        role: "admin",
        created_at: "2026-01-24T18:13:00.286Z",
      },
    ];

    for (const u of users) {
      await connection.query(`
        INSERT IGNORE INTO users (id, username, password, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [u.id, u.username, u.password, u.role, u.created_at]);
    }
    console.log(`  ✓ ${users.length} usuários inseridos\n`);

    // ============================================================
    // 3. PRODUCTS (sem o campo images - agora normalizado)
    // ============================================================
    console.log("→ Produtos...");
    const products = [
      {
        id: 1,
        name: "Teste",
        description: "produto teste que resolve tudo",
        price: 145,
        image: "/uploads/96407282-d835-43cc-a199-1b6a56d3de0f.jpg",
        category: "Proteção",
        in_stock: true,
        images: [],
        created_at: "2026-01-26T12:16:38.356Z",
      },
      {
        id: 2,
        name: "Lava Auto V Floc  Vonixx",
        description: "V-Floc é um lava autos de alta performance e de pH neutro. Sua fórmula contém agentes condicionadores e tensoativos especiais que proporcionam uma lavagem suave e eficiente. V-Floc tem alto grau de lubrificação, promovendo redução significativa do coeficiente de atrito, proporcionando um melhor deslize da luva microfibra e reduzindo de forma efetiva as chances de microrriscos na pintura. V-Floc também promove brilho e aspecto de renovação da pintura.",
        price: 25,
        image: "/uploads/49ac1dc8-3ce7-4fae-984d-b4f9a74fd0d7.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: ["/uploads/99367266-428c-4e41-8cd9-91fabb6ba441.jpg", "/uploads/9deb0d35-1af9-4628-bc9a-3c2e443f36a5.jpg"],
        created_at: "2026-01-27T15:33:41.022Z",
      },
      {
        id: 9,
        name: "lava auto moto- V  Vonixx",
        description: "Moto-V é um lava-motos, desenvolvido para limpeza de alta eficiência. Sua formulação equilibrada permite uso, sem agredir, em todas as partes da motocicleta, seja motor, pintura, metais ou plásticos. As possíveis diluições do produto proporcionam ao mesmo a remoção dos mais diversos tipos de sujeira, como barro, lama, graxa e óleo.\n\nDiluição\nRemoção de graxa e óleo - Até 1:10\nLavagem diária da pintura - Até 1:20\nRemoção de barro e lama - Até 1:50\n\n-Remove barro e lama\n-Poder desengraxante",
        price: 65,
        image: "/uploads/ca6da495-1518-4cdb-9afa-215a63590199.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: [],
        created_at: "2026-01-27T19:27:04.602Z",
      },
      {
        id: 11,
        name: "Lava auto Vintex ",
        description: "O Lava Autos é um produto que foi desenvolvido para limpar, proteger e conservar a lataria do veículo. Por possuir pH neutro, pode ser aplicado em qualquer superfície sem correr o risco de danificá-la.\n\n-Limpa protege e dá brilho\n-pH neutro\n-Pode ser aplicado em qualquer superfície\n\nModo de usar\n1. Dilua o produto na concentração de 100ml para cada 5L de água e, com o auxílio de uma luva de microfibra, comece a lavar o veículo pelas partes mais altas e depois as mais baixas\n2. Enxágue em seguida até remover toda a espuma\n3. Para melhor resultado, seque o veículo com a toalha de secagem",
        price: 21,
        image: "/uploads/ab003d14-2139-4c40-b107-01ec9ed4b83d.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: ["/uploads/2cc05a7b-58f8-4a72-993f-7f82641a7cfe.jpg", "/uploads/0251cd0c-2527-47e1-847e-8bc69ab252eb.jpg"],
        created_at: "2026-01-27T19:31:43.454Z",
      },
      {
        id: 21,
        name: "LAVA AUTO V MOL VONIXX",
        description: "V-Mol é um lava autos biodegradável com pH levemente básico que não agride a superfície. Ideal para  lavagem de automóveis, em especial para remoção de sujeiras mais difíceis, como remoção de barro e óleo. Agora com aroma cereja intensa!",
        price: 20,
        image: "/uploads/faf1d77b-1d07-4f5f-9239-4afe39af7d61.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: ["/uploads/2f0b871d-d58d-4295-8bff-340b9522b9be.jpg"],
        created_at: "2026-02-05T19:15:16.018Z",
      },
      {
        id: 23,
        name: "LAVA AUTO DETMOL SANDET",
        description: "O Det Mol da Sandet é um detergente desengraxante desenvolvido para limpeza pesada em diversas superfícies.\n\nSua fórmula inovadora remove sujeiras difíceis como graxa, óleo, lama e outras sujidades incrustadas, sem danificar a pintura ou oxidar as peças.\n\nÉ ideal para limpeza de veículos pesados e de passeio, chassis, máquinas, pisos, paredes e equipamentos em geral.\n\nCom alta capacidade de diluição, o Det Mol garante um excelente rendimento, tornando a limpeza mais econômica e eficiente.",
        price: 30,
        image: "/uploads/eddc0ff3-a4f9-48df-b426-634cd00aa7e4.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: [],
        created_at: "2026-02-05T19:19:52.902Z",
      },
      {
        id: 24,
        name: "LAVA AUTO CITRON 1,5 VONIXX",
        description: "Sua poderosa fórmula combina tensoativos especiais e solventes naturais extraídos cuidadosamente de cascas de laranja. Com uma ação de lavagem pesada, Citron é a escolha ideal para eliminar graxa, matéria orgânica e ceras, proporcionando uma limpeza profunda e impecável à pintura do seu automóvel.",
        price: 45.9,
        image: "/uploads/64d3a465-4925-4684-bed1-a59762d84913.jpg",
        category: "Lava Autos",
        in_stock: true,
        images: ["/uploads/853c9daa-4c52-4d11-9c78-c721c201bd79.jpg"],
        created_at: "2026-02-05T19:23:07.983Z",
      },
    ];

    for (const p of products) {
      await connection.query(`
        INSERT IGNORE INTO products (id, name, description, price, image, category, in_stock, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.name, p.description, p.price, p.image, p.category, p.in_stock, p.created_at]);
      
      // Inserir imagens na tabela normalizada
      for (let i = 0; i < p.images.length; i++) {
        await connection.query(`
          INSERT IGNORE INTO product_images (product_id, image_url, sort_order)
          VALUES (?, ?, ?)
        `, [p.id, p.images[i], i]);
      }
    }
    
    // Ajustar AUTO_INCREMENT
    const [maxProductId] = await connection.query("SELECT MAX(id) as max_id FROM products");
    if (maxProductId[0]?.max_id) {
      await connection.query(`ALTER TABLE products AUTO_INCREMENT = ?`, [maxProductId[0].max_id + 1]);
    }
    console.log(`  ✓ ${products.length} produtos inseridos\n`);

    // ============================================================
    // 4. PRODUCT VARIATIONS
    // ============================================================
    console.log("→ Variações de produtos...");
    const variations = [
      { id: 1, product_id: 11, label: "1,5", price: 21, in_stock: true, created_at: "2026-01-30T16:02:31.121Z" },
      { id: 4, product_id: 2, label: "240 ml", price: 18, in_stock: true, created_at: "2026-01-30T17:06:07.721Z" },
      { id: 5, product_id: 2, label: "500 ml", price: 25, in_stock: true, created_at: "2026-01-30T17:06:13.704Z" },
      { id: 6, product_id: 2, label: "1,5 lts", price: 52, in_stock: true, created_at: "2026-01-30T17:06:21.805Z" },
      { id: 7, product_id: 2, label: "3 lts", price: 85, in_stock: true, created_at: "2026-01-30T17:06:34.142Z" },
      { id: 8, product_id: 2, label: "5 lts", price: 125, in_stock: true, created_at: "2026-01-30T17:06:41.397Z" },
      { id: 9, product_id: 9, label: "500 ml", price: 35, in_stock: true, created_at: "2026-01-30T21:51:49.798Z" },
      { id: 10, product_id: 9, label: "1,5 lts", price: 65, in_stock: true, created_at: "2026-01-30T21:51:58.284Z" },
      { id: 11, product_id: 11, label: "5 lts", price: 59, in_stock: true, created_at: "2026-01-30T22:17:22.028Z" },
      { id: 12, product_id: 11, label: "500 ml", price: 12, in_stock: true, created_at: "2026-01-30T22:17:36.514Z" },
      { id: 13, product_id: 21, label: "500 ML", price: 20, in_stock: true, created_at: "2026-02-05T19:15:28.651Z" },
      { id: 14, product_id: 21, label: "1,5 LTS", price: 38, in_stock: true, created_at: "2026-02-05T19:15:56.399Z" },
      { id: 15, product_id: 21, label: "5 LTS", price: 106, in_stock: true, created_at: "2026-02-05T19:16:09.113Z" },
      { id: 16, product_id: 23, label: "1LT", price: 30, in_stock: true, created_at: "2026-02-05T19:20:32.130Z" },
      { id: 17, product_id: 23, label: "5 LTS", price: 91, in_stock: true, created_at: "2026-02-05T19:20:39.725Z" },
    ];

    for (const v of variations) {
      await connection.query(`
        INSERT IGNORE INTO product_variations (id, product_id, label, price, in_stock, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [v.id, v.product_id, v.label, v.price, v.in_stock, v.created_at]);
    }
    
    const [maxVariationId] = await connection.query("SELECT MAX(id) as max_id FROM product_variations");
    if (maxVariationId[0]?.max_id) {
      await connection.query(`ALTER TABLE product_variations AUTO_INCREMENT = ?`, [maxVariationId[0].max_id + 1]);
    }
    console.log(`  ✓ ${variations.length} variações inseridas\n`);

    // ============================================================
    // 5. CUSTOMERS
    // ============================================================
    console.log("→ Clientes...");
    const customers = [
      {
        id: "6901c78b-1424-414b-ace4-1dba6189ee8c",
        email: "sufeijo@gmail.com",
        phone: "53981047948",
        name: "Suelen ",
        nickname: null,
        delivery_address: "Dr Amarante 1289",
        password: null,
        is_registered: false,
        created_at: "2026-01-27T15:47:36.567Z",
      },
      {
        id: "0acd2e68-b946-482b-b063-b10c5b51faf1",
        email: null,
        phone: "53 981116072",
        name: "SUELEN",
        nickname: null,
        delivery_address: null,
        password: null,
        is_registered: false,
        created_at: "2026-01-28T14:21:59.789Z",
      },
      {
        id: "af21f055-afa6-46ae-895b-5d1573bed70f",
        email: null,
        phone: "55 53 981116072",
        name: "SUELEN",
        nickname: null,
        delivery_address: null,
        password: null,
        is_registered: false,
        created_at: "2026-01-28T14:22:35.746Z",
      },
      {
        id: "c2340f31-a0b8-4911-ab14-6cc895f89431",
        email: "v4lente@gmail.com",
        phone: "47996560228",
        name: "David",
        nickname: null,
        delivery_address: "Avenida Independência, 1840\napto 102",
        password: null,
        is_registered: false,
        created_at: "2026-02-05T19:40:07.892Z",
      },
    ];

    for (const c of customers) {
      await connection.query(`
        INSERT IGNORE INTO customers (id, email, phone, name, nickname, delivery_address, password, is_registered, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.id, c.email, c.phone, c.name, c.nickname, c.delivery_address, c.password, c.is_registered, c.created_at]);
    }
    console.log(`  ✓ ${customers.length} clientes inseridos\n`);

    // ============================================================
    // 6. ORDERS
    // ============================================================
    console.log("→ Pedidos...");
    const orders = [
      {
        id: 1,
        customer_id: "6901c78b-1424-414b-ace4-1dba6189ee8c",
        status: "pending",
        total: 25,
        customer_name: "Suelen ",
        customer_phone: "53981047948",
        customer_email: "sufeijo@gmail.com",
        delivery_address: "Dr Amarante 1289",
        whatsapp_message: "🏍️ *Novo Pedido*\n\n*Cliente:* Suelen \n*Telefone:* 53981047948\n*Email:* sufeijo@gmail.com\n*Endereço:* Dr Amarante 1289\n\n*Itens:*\n• 1x Lava Auto V Floc Vonixx 500 ml  - R$ 25.00\n\n*Total: R$ 25.00*",
        created_at: "2026-01-27T15:47:36.617Z",
      },
      {
        id: 2,
        customer_id: "0acd2e68-b946-482b-b063-b10c5b51faf1",
        status: "pending",
        total: 21,
        customer_name: "SUELEN",
        customer_phone: "53 981116072",
        customer_email: null,
        delivery_address: null,
        whatsapp_message: "🏍️ *Novo Pedido*\n\n*Cliente:* SUELEN\n*Telefone:* 53 981116072\n\n*Itens:*\n• 1x Lava auto 1,5 lts Vintex - R$ 21.00\n\n*Total: R$ 21.00*",
        created_at: "2026-01-28T14:21:59.839Z",
      },
      {
        id: 3,
        customer_id: "af21f055-afa6-46ae-895b-5d1573bed70f",
        status: "pending",
        total: 21,
        customer_name: "SUELEN",
        customer_phone: "55 53 981116072",
        customer_email: null,
        delivery_address: null,
        whatsapp_message: "🏍️ *Novo Pedido*\n\n*Cliente:* SUELEN\n*Telefone:* 55 53 981116072\n\n*Itens:*\n• 1x Lava auto 1,5 lts Vintex - R$ 21.00\n\n*Total: R$ 21.00*",
        created_at: "2026-01-28T14:22:35.794Z",
      },
      {
        id: 4,
        customer_id: "c2340f31-a0b8-4911-ab14-6cc895f89431",
        status: "pending",
        total: 145,
        customer_name: "David",
        customer_phone: "47996560228",
        customer_email: "v4lente@gmail.com",
        delivery_address: "Avenida Independência, 1840\napto 102",
        whatsapp_message: "🏍️ *Novo Pedido*\n\n*Cliente:* David\n*Telefone:* 47996560228\n*Email:* v4lente@gmail.com\n*Endereço:* Avenida Independência, 1840\napto 102\n\n*Itens:*\n• 1x Teste - R$ 145.00\n\n*Total: R$ 145.00*",
        created_at: "2026-02-05T19:40:07.938Z",
      },
    ];

    for (const o of orders) {
      await connection.query(`
        INSERT IGNORE INTO orders (id, customer_id, status, total, customer_name, customer_phone, customer_email, delivery_address, whatsapp_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [o.id, o.customer_id, o.status, o.total, o.customer_name, o.customer_phone, o.customer_email, o.delivery_address, o.whatsapp_message, o.created_at]);
    }
    
    const [maxOrderId] = await connection.query("SELECT MAX(id) as max_id FROM orders");
    if (maxOrderId[0]?.max_id) {
      await connection.query(`ALTER TABLE orders AUTO_INCREMENT = ?`, [maxOrderId[0].max_id + 1]);
    }
    console.log(`  ✓ ${orders.length} pedidos inseridos\n`);

    // ============================================================
    // 7. ORDER ITEMS
    // ============================================================
    console.log("→ Itens de pedidos...");
    const orderItems = [
      { id: 1, order_id: 1, product_id: 2, product_name: "Lava Auto V Floc Vonixx 500 ml ", product_price: 25, quantity: 1 },
      { id: 2, order_id: 2, product_id: 11, product_name: "Lava auto 1,5 lts Vintex", product_price: 21, quantity: 1 },
      { id: 3, order_id: 3, product_id: 11, product_name: "Lava auto 1,5 lts Vintex", product_price: 21, quantity: 1 },
      { id: 4, order_id: 4, product_id: 1, product_name: "Teste", product_price: 145, quantity: 1 },
    ];

    for (const oi of orderItems) {
      await connection.query(`
        INSERT IGNORE INTO order_items (id, order_id, product_id, product_name, product_price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [oi.id, oi.order_id, oi.product_id, oi.product_name, oi.product_price, oi.quantity]);
    }
    
    const [maxOrderItemId] = await connection.query("SELECT MAX(id) as max_id FROM order_items");
    if (maxOrderItemId[0]?.max_id) {
      await connection.query(`ALTER TABLE order_items AUTO_INCREMENT = ?`, [maxOrderItemId[0].max_id + 1]);
    }
    console.log(`  ✓ ${orderItems.length} itens de pedidos inseridos\n`);

    // ============================================================
    // 8-11. TABELAS VAZIAS (estrutura preparada)
    // ============================================================
    console.log("→ Reviews, Posts, Serviços, Agendamentos...");
    console.log("  - Tabelas vazias (prontas para uso)\n");

    await connection.commit();

    // ============================================================
    // RESUMO
    // ============================================================
    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  SEED CONCLUÍDO COM SUCESSO!                  ║");
    console.log("╠═══════════════════════════════════════════════╣");
    console.log(`║  • 1 configuração do site                      ║`);
    console.log(`║  • ${users.length} usuários (senhas reais preservadas)      ║`);
    console.log(`║  • ${products.length} produtos                                ║`);
    console.log(`║  • ${variations.length} variações de produtos               ║`);
    console.log(`║  • ${customers.length} clientes                               ║`);
    console.log(`║  • ${orders.length} pedidos                                 ║`);
    console.log(`║  • ${orderItems.length} itens de pedidos                      ║`);
    console.log("╠═══════════════════════════════════════════════╣");
    console.log("║  Tabelas vazias (prontas para uso):            ║");
    console.log("║    reviews, service_posts, service_post_media, ║");
    console.log("║    offered_services, appointments              ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Erro durante o seed:", error.message);
    if (error.code) {
      console.error(`  Código do erro: ${error.code}`);
    }
    // Não lança erro para não interromper o deploy
    console.log("⚠ O deploy continuará, mas os dados iniciais podem não estar presentes.");
  } finally {
    if (connection) {
      connection.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

main().catch((err) => {
  console.error("Erro fatal no seed:", err);
  // Não usa process.exit(1) para não interromper o deploy
});
