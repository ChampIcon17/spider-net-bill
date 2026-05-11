import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type RouterCommandResult = unknown;
type RouterEntry = { ".id"?: string };
type RouterConnection = {
  connect: () => Promise<unknown>;
  close: () => Promise<unknown>;
  write: (path: string, args?: string[]) => Promise<RouterCommandResult>;
};
type RouterConstructor = new (opts: {
  host?: string;
  user?: string;
  password?: string;
  port: number;
  timeout: number;
}) => RouterConnection;

/**
 * RouterOS integration with controlled fallback in development.
 */
@Injectable()
export class MikroTikService {
  private readonly logger = new Logger(MikroTikService.name);

  constructor(private readonly config: ConfigService) {}

  private isEnabled(): boolean {
    return this.config.get<string>("MIKROTIK_ENABLED") === "true";
  }

  private async withRouter<T>(work: (conn: RouterConnection) => Promise<T>): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug("MIKROTIK_ENABLED=false; skipping RouterOS command");
      return;
    }

    let RouterOSAPI: RouterConstructor;
    try {
      const routerModule = (await import("node-routeros")) as { RouterOSAPI: RouterConstructor };
      RouterOSAPI = routerModule.RouterOSAPI;
    } catch (error) {
      this.logger.error("RouterOS package unavailable; keeping graceful fallback", error as Error);
      return;
    }

    const conn = new RouterOSAPI({
      host: this.config.get<string>("MIKROTIK_HOST"),
      user: this.config.get<string>("MIKROTIK_USER"),
      password: this.config.get<string>("MIKROTIK_PASS"),
      port: Number(this.config.get<number>("MIKROTIK_PORT") ?? 8728),
      timeout: 5000,
    });

    try {
      await conn.connect();
      await work(conn);
    } catch (error) {
      this.logger.error("RouterOS command failed", error as Error);
    } finally {
      try {
        await conn.close();
      } catch {
        // Ignore close failures, connection is best-effort.
      }
    }
  }

  async connectUser(macAddress: string, speedLimitProfile: string): Promise<void> {
    try {
      await this.withRouter(async (conn) => {
        // Practical v1 policy: put paid clients on hotspot bypass list with a profile tag in comment.
        await conn.write("/ip/hotspot/ip-binding/add", [
          `=mac-address=${macAddress}`,
          "=type=bypassed",
          `=comment=wifi-billing:${speedLimitProfile}`,
        ]);
      });
      this.logger.log(`MikroTik connectUser mac=${macAddress} profile=${speedLimitProfile}`);
    } catch (err) {
      this.logger.error(`MikroTik connectUser failed for ${macAddress}`, err instanceof Error ? err.stack : err);
    }
  }

  async disconnectUser(macAddress: string): Promise<void> {
    try {
      await this.withRouter(async (conn) => {
        const items = (await conn.write("/ip/hotspot/ip-binding/print", [
          `?mac-address=${macAddress}`,
        ])) as RouterEntry[];
        await Promise.allSettled(
          items
            .map((item) => item[".id"])
            .filter((id): id is string => Boolean(id))
            .map((id) => conn.write("/ip/hotspot/ip-binding/remove", [`=.id=${id}`])),
        );
      });
      this.logger.log(`MikroTik disconnectUser mac=${macAddress}`);
    } catch (err) {
      this.logger.error(`MikroTik disconnectUser failed for ${macAddress}`, err instanceof Error ? err.stack : err);
    }
  }
}
