import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreaker } from "../../src/server/circuit-breaker.js";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, successThreshold: 2, cooldownMs: 100 });
  });

  it("starts in CLOSED state", () => {
    expect(breaker.currentState).toBe("CLOSED");
    expect(breaker.isOpen()).toBe(false);
  });

  it("opens after failureThreshold consecutive failures", () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.currentState).toBe("OPEN");
    expect(breaker.isOpen()).toBe(true);
  });

  it("transitions to HALF_OPEN after cooldown period", async () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(breaker.isOpen()).toBe(false);
    expect(breaker.currentState).toBe("HALF_OPEN");
  });

  it("closes from HALF_OPEN after successThreshold successes", async () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    breaker.isOpen(); // trigger HALF_OPEN transition
    breaker.recordSuccess();
    breaker.recordSuccess();
    expect(breaker.currentState).toBe("CLOSED");
  });

  it("resets failure count on success", () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.currentState).toBe("CLOSED");
  });
});
