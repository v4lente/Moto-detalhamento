import { expect, test } from "@playwright/test";
import { formatOrderItemName } from "../frontend/shared/lib/formatters";

test("padroniza nomes antigos sem alterar o rótulo da variação escolhida", () => {
  expect(formatOrderItemName("  INTERIORES   1 LT CADILLAC  ", "500 ML"))
    .toBe("Interiores 1 Lt Cadillac (500 ML)");
  expect(formatOrderItemName("Lava auto Demolidor Cadillac", " 1   L "))
    .toBe("Lava Auto Demolidor Cadillac (1 L)");
});

test("mantém identificação legível para item sem variação", () => {
  expect(formatOrderItemName("  KIT PINCÉIS KERS ( 5 UNIDADE )  ", null))
    .toBe("Kit Pincéis Kers (5 Unidade)");
  expect(formatOrderItemName("Cadmix Cadillac", "  "))
    .toBe("Cadmix Cadillac");
});
