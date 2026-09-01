import { test, expect } from "@playwright/test";
import { orderSearchSchema } from "../shared/contracts/validation";
test("filtros de histórico têm paginação limitada", () => { expect(orderSearchSchema.parse({ page: 2, pageSize: 50 }).pageSize).toBe(50); expect(orderSearchSchema.safeParse({ pageSize: 101 }).success).toBeFalsy(); });
