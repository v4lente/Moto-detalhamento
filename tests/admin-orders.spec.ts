import { test, expect } from "@playwright/test";
import { orderStatusTransitionSchema } from "../shared/contracts/validation";
test("admin só envia estados conhecidos", () => { expect(orderStatusTransitionSchema.safeParse({ status: "confirmed" }).success).toBeTruthy(); expect(orderStatusTransitionSchema.safeParse({ status: "completed" }).success).toBeFalsy(); });
