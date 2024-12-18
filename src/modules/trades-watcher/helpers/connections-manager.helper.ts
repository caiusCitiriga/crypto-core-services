import { CronJob } from 'cron';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ConnectionsManager {
  private _connectionsCount = 0;
  private _maxConnectionsCap = 300;
  private _exchangeName = 'unnamed exchange';
  private _reconnectionEvents: Record<string, Date[]> = {};

  private readonly _logger = new Logger(ConnectionsManager.name);

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  set exchangeName(name: string) {
    this._exchangeName = name;
  }

  set maxConnectionsCap(value: number) {
    this._maxConnectionsCap = value;
  }

  get connectionsCount() {
    return this._connectionsCount;
  }

  get reconnectionEvents() {
    return this._reconnectionEvents;
  }

  reset() {
    this._connectionsCount = 0;
    this._reconnectionEvents = {};
  }

  incrementConnectionsCount(inc = 1) {
    this._connectionsCount += inc;
  }

  trackReconnectionEvent(id: string) {
    this.incrementConnectionsCount();
    if (!!this._reconnectionEvents[id])
      this._reconnectionEvents[id].push(new Date());
    else this._reconnectionEvents[id] = [new Date()];

    if (this._connectionsCount >= this._maxConnectionsCap)
      // TODO: do something more meaningful here
      this._logger.error(
        `[${this._exchangeName}] Connections count reached ${this._maxConnectionsCap}+ before being reset by time-window job. This will collide with exchange rate limits.`,
      );
  }

  scheduleConnectionsResetJob(eachMinutes = 5) {
    const cronString = `*/${eachMinutes}  * * * *`;
    const jobName = `${this._exchangeName}:${this.scheduleConnectionsResetJob.name}`;

    const job = new CronJob(cronString, () => {
      if (this.connectionsCount) {
        const titleString = `######### CONN RATE LIMITS RESET #########`;
        let messageString = `- Total reconnection events: ${this.connectionsCount}`;
        const wsKeysReconnectionEvents: string[] = [];

        Object.keys(this.reconnectionEvents).forEach((wsKey) => {
          const event = this.reconnectionEvents[wsKey];
          wsKeysReconnectionEvents.push(
            `- [${wsKey}] reconnected ${event.length} times: ${event.map((d) =>
              d.toLocaleTimeString(),
            )}`,
          );
        });
        wsKeysReconnectionEvents.forEach(
          (msg) => (messageString += `\n${msg}`),
        );

        this._logger.warn(titleString);
        this._logger.warn(messageString);
      }

      this.reset();
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }
}
