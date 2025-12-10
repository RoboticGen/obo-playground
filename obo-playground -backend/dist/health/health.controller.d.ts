import { HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private http;
    private db;
    private memory;
    private disk;
    constructor(health: HealthCheckService, http: HttpHealthIndicator, db: TypeOrmHealthIndicator, memory: MemoryHealthIndicator, disk: DiskHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    ping(): {
        status: string;
        timestamp: string;
    };
}
