import { describe, expect, it } from "vitest";

function calculateTotal(price: number, quantity: number) {
  return price * quantity;
}

describe("calculateTotal", () => {
  it("calculates the total price correctly", () => {
    expect(calculateTotal(10, 3)).toBe(30);
  });
});