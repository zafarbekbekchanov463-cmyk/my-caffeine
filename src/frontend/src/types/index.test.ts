import { describe, expect, it } from "vitest";

import { DeliveryMethod } from "@/backend";
import {
  DELIVERY_COST,
  DELIVERY_LABELS,
  FREE_DELIVERY_FROM,
  ORDER_STATUS_LABELS,
  SORT_LABELS,
  deliveryCostFor,
} from "@/types";

describe("deliveryCostFor", () => {
  it("charges courier delivery below the free threshold", () => {
    expect(deliveryCostFor(DeliveryMethod.courier, 1000)).toBe(DELIVERY_COST);
  });

  it("makes courier delivery free at or above the threshold", () => {
    expect(deliveryCostFor(DeliveryMethod.courier, FREE_DELIVERY_FROM)).toBe(0);
    expect(deliveryCostFor(DeliveryMethod.courier, 9000)).toBe(0);
  });

  it("charges pickup point below its own threshold and free above", () => {
    expect(deliveryCostFor(DeliveryMethod.pickupPoint, 1000)).toBe(290);
    expect(deliveryCostFor(DeliveryMethod.pickupPoint, 3000)).toBe(0);
  });

  it("always makes self pickup free", () => {
    expect(deliveryCostFor(DeliveryMethod.selfPickup, 0)).toBe(0);
    expect(deliveryCostFor(DeliveryMethod.selfPickup, 100)).toBe(0);
  });
});

describe("label maps", () => {
  it("labels every delivery method", () => {
    for (const method of Object.values(DeliveryMethod)) {
      expect(DELIVERY_LABELS[method]).toBeTruthy();
    }
  });

  it("labels every order status with the accepted Russian wording", () => {
    expect(ORDER_STATUS_LABELS.accepted).toBe("Принят");
    expect(ORDER_STATUS_LABELS.assembling).toBe("Собирается");
    expect(ORDER_STATUS_LABELS.shipped).toBe("Отправлен");
    expect(ORDER_STATUS_LABELS.delivered).toBe("Доставлен");
  });

  it("labels every sort option", () => {
    expect(Object.keys(SORT_LABELS).length).toBeGreaterThanOrEqual(5);
  });
});
