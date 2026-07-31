import type { IdentityAuditEvent } from '../types/identity'

export interface AuditAdapter {
  write(event: IdentityAuditEvent): void | Promise<void>
}

export class MemoryAuditAdapter implements AuditAdapter {
  private events: IdentityAuditEvent[] = []
  private readonly limit: number

  constructor(limit = 500) {
    this.limit = limit
  }

  write(event: IdentityAuditEvent): void {
    this.events = [event, ...this.events].slice(0, this.limit)
  }

  read(): readonly IdentityAuditEvent[] {
    return this.events
  }

  clear(): void {
    this.events = []
  }
}

export function createMemoryAuditAdapter(limit?: number): MemoryAuditAdapter {
  return new MemoryAuditAdapter(limit)
}
