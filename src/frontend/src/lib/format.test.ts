import { describe, expect, it } from "vitest";

import {
  discountPercent,
  formatDate,
  formatNumber,
  formatPrice,
  pluralize,
  timestampToDate,
} from "@/lib/format";

describe("formatPrice", () => {
  it("formats a bigint price as RUB without decimals", () => {
    const formatted = formatPrice(2990n);
    expect(formatted).toContain("2");
    expect(formatted).toContain("990");
    expect(formatted).not.toContain(",");
  });

  it("formats a number price the same way as a bigint", () => {
    expect(formatPrice(2990)).toBe(formatPrice(2990n));
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234)).toContain("1");
    expect(formatNumber(1234)).toContain("234");
  });
});

describe("discountPercent", () => {
  it("computes the rounded discount from old to current price", () => {
    expect(discountPercent(750n, 1000n)).toBe(25);
  });

  it("returns 0 when there is no discount", () => {
    expect(discountPercent(1000n, 1000n)).toBe(0);
    expect(discountPercent(1200n, 1000n)).toBe(0);
  });

  it("returns 0 when the old price is missing", () => {
    expect(discountPercent(1000n, 0n)).toBe(0);
  });
});

describe("pluralize", () => {
  it("selects the Russian plural form by count", () => {
    expect(pluralize(1, "товар", "товара", "товаров")).toBe("товар");
    expect(pluralize(2, "товар", "товара", "товаров")).toBe("товара");
    expect(pluralize(5, "товар", "товара", "товаров")).toBe("товаров");
    expect(pluralize(11, "товар", "товара", "товаров")).toBe("товаров");
    expect(pluralize(21, "товар", "товара", "товаров")).toBe("товар");
  });
});

describe("timestampToDate / formatDate", () => {
  it("converts nanosecond timestamps to a date", () => {
    const date = timestampToDate(1_700_000_000_000_000_000n);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCFullYear()).toBe(2023);
  });

  it("returns a placeholder for an invalid timestamp", () => {
    expect(formatDate(0n)).not.toBe("");
  });
});
