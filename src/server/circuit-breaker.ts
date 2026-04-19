type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  cooldownMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly cooldownMs: number;

  public constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
  }

  public get currentState(): CircuitState {
    return this.state;
  }

  public isOpen(): boolean {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (this.openedAt !== null && now - this.openedAt >= this.cooldownMs) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
      }
    }
  }

  public recordFailure(): void {
    this.successCount = 0;
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.openedAt = Date.now();
    }
  }
}
