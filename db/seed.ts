import { db } from "./index";
import { products } from "@shared/schema";

const seedProducts = [
  {
    name: "Shampoo Premium MotoWash",
    description: "Shampoo neutro de alta espuma para limpeza segura de carenagens.",
    price: 45.90,
    image: "/assets/generated_images/premium_detailing_shampoo_bottle.png",
    category: "Lavagem",
  },
  {
    name: "Kit Toalhas Microfibra",
    description: "Kit com 3 toalhas de alta densidade para secagem sem riscos.",
    price: 39.90,
    image: "/assets/generated_images/microfiber_towels_stack.png",
    category: "Acessórios",
  },
  {
    name: "Ceramic Shield 9H",
    description: "Proteção cerâmica de longa duração para pintura e metais.",
    price: 189.90,
    image: "/assets/generated_images/ceramic_coating_bottle.png",
    category: "Proteção",
  },
  {
    name: "Desengraxante MotoChain",
    description: "Poderoso removedor de graxa para correntes e rodas.",
    price: 35.00,
    image: "/assets/generated_images/premium_detailing_shampoo_bottle.png",
    category: "Limpeza Pesada",
  },
  {
    name: "Cera Líquida QuickDetailer",
    description: "Brilho instantâneo e repelência à água.",
    price: 55.00,
    image: "/assets/generated_images/ceramic_coating_bottle.png",
    category: "Acabamento",
  },
  {
    name: "Luva de Lavagem Lã Natural",
    description: "Suavidade extrema para evitar microrriscos na pintura.",
    price: 65.00,
    image: "/assets/generated_images/microfiber_towels_stack.png",
    category: "Acessórios",
  },
];

async function seed() {
  console.log("Seeding products...");
  
  for (const product of seedProducts) {
    await db.insert(products).values(product);
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
