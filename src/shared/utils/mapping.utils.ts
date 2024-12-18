import { MiscUtils } from './misc.utils';

export class MappingUtils {
  static TradingViewResolutionToCCSResolution(res: string): string {
    if (!isNaN(+res)) return this.mapMinutesToHoursIfNeeded(+res);
    const resUnit = res[res.length - 1];
    switch (resUnit) {
      case 'S':
        return `${res.replace('S', '')}s`;
      case 'H':
      case 'h':
        return `${res.replace('h', '').replace('H', '')}h`;
      case 'D':
        return `${res.replace('D', '')}d`;
      case 'W':
        return `${res.replace('W', '')}w`;
      case 'M':
        return res;
      default:
        throw new Error(`Unknown TV resolution`);
    }
  }

  private static mapMinutesToHoursIfNeeded(mins: number): string {
    if (mins >= 60) {
      return `${(mins / 60).toFixed(0)}h`;
    }

    return `${mins}m`;
  }

  static CCSResolutionToTradingViewResolution(res: string): string {
    const resUnit = res[res.length - 1];
    switch (resUnit) {
      case 's':
        return res.replace('s', 'S');
      case 'm':
        return res.replace('m', '');
      case 'h':
        return (+res.replace('h', '') * 60).toString();
      case 'd':
        return res.replace('d', 'D');
      case 'w':
        return res.replace('w', 'W');
      case 'M':
        return res;
      case 'y':
        return `${12 * +res.split('y')[0]}M`;
      default:
        throw new Error(`Unknown CB resolution`);
    }
  }

  static hoursToMinutes(tf: string): number {
    const tfMeta = MiscUtils.getTfMetadata(tf);
    return tfMeta.amount * 60;
  }

  static minutesToHours(minutes: number): number {
    return minutes / 60;
  }
}
