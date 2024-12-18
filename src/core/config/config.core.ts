import * as process from 'process';
import { Configs } from './config.enum';

export class AppConfig {
  static get enableSwagger(): boolean {
    const value = this.getConfig(Configs.enableSwagger) || 'true';
    return value === 'true';
  }

  static get acceptUnknownOrigins(): boolean {
    const value = this.getConfig(Configs.acceptUnknownOrigins) || 'false';
    return value === 'true';
  }

  static get verboseRequestsLogging(): boolean {
    const value = this.getConfig(Configs.verboseRequestsLogging) || 'true';
    return value === 'true';
  }

  static get allowedRestOrigins(): string[] {
    const value = this.getConfig(Configs.allowedRestOrigins) || '*';
    return value
      .split(',')
      .map((i) => i.trim())
      .filter((i) => !!i && !!i.length);
  }

  public static get port(): number {
    return +this.getConfig(Configs.port) || 3000;
  }

  //   public static get dbName(): string {
  //     this.ensureConfigExistenceOrThrow(Configs.dbName);
  //     return this.getConfig(Configs.dbName);
  //   }

  //   public static get dbUrl(): string {
  //     this.ensureConfigExistenceOrThrow(Configs.dbUrl);
  //     return this.getConfig(Configs.dbUrl);
  //   }

  private static ensureConfigExistenceOrThrow(config: Configs): void {
    if (!process.env[config])
      throw new Error(`Missing env config ${config}. Please provide it`);
  }

  private static getConfig(config: Configs): string {
    return process.env[config] || null;
  }
}
