import shampooImg from "@assets/generated_images/premium_detailing_shampoo_bottle.png";
import towelsImg from "@assets/generated_images/microfiber_towels_stack.png";
import ceramicImg from "@assets/generated_images/ceramic_coating_bottle.png";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Shampoo Premium MotoWash",
    description: "Shampoo neutro de alta espuma para limpeza segura de carenagens.",
    price: 45.90,
    image: shampooImg,
    category: "Lavagem",
  },
  {
    id: 2,
    name: "Kit Toalhas Microfibra",
    description: "Kit com 3 toalhas de alta densidade para secagem sem riscos.",
    price: 39.90,
    image: towelsImg,
    category: "Acessórios",
  },
  {
    id: 3,
    name: "Ceramic Shield 9H",
    description: "Proteção cerâmica de longa duração para pintura e metais.",
    price: 189.90,
    image: ceramicImg,
    category: "Proteção",
  },
  {
    id: 4,
    name: "Desengraxante MotoChain",
    description: "Poderoso removedor de graxa para correntes e rodas.",
    price: 35.00,
    image: shampooImg, // Reusing for mock
    category: "Limpeza Pesada",
  },
  {
    id: 5,
    name: "Cera Líquida QuickDetailer",
    description: "Brilho instantâneo e repelência à água.",
    price: 55.00,
    image: ceramicImg, // Reusing for mock
    category: "Acabamento",
  },
  {
    id: 6,
    name: "Luva de Lavagem Lã Natural",
    description: "Suavidade extrema para evitar microrriscos na pintura.",
    price: 65.00,
    image: towelsImg, // Reusing for mock
    category: "Acessórios",
  },
];
