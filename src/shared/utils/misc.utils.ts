export class MiscUtils {
  static getNumberPrecision(number: string | number): number {
    return (number.toString().split('.')[1] ?? '1').length;
  }

  static removeSymbolSlash(sym: string): string {
    return sym.replace('/', '');
  }

  static getDistinctStrings(strings: string[]): string[] {
    return [...new Set(strings)];
  }

  static async sleepMs(ms: number): Promise<void> {
    return new Promise<void>((r) => setTimeout(() => r(), ms));
  }

  static async sleepS(s: number): Promise<void> {
    return this.sleepMs(s * 1000);
  }

  /**
   * converts a time frame to milliseconds
   * @param timeFrame string in form of (s,m,h,d,w,M,y)
   * @returns number ms representation of given time frame
   */
  static parseTimeFrameToMs(timeFrame: string) {
    const amount = +timeFrame.slice(0, -1);
    const unit = timeFrame.slice(-1);
    let scale: number;

    if (unit === 'y') {
      scale = 60 * 60 * 24 * 365;
    } else if (unit === 'M') {
      scale = 60 * 60 * 24 * 30;
    } else if (unit === 'w') {
      scale = 60 * 60 * 24 * 7;
    } else if (unit === 'd') {
      scale = 60 * 60 * 24;
    } else if (unit === 'h') {
      scale = 60 * 60;
    } else if (unit === 'm') {
      scale = 60;
    } else if (unit === 's') {
      scale = 1;
    } else {
      throw Error('time frame unit ' + unit + ' is not supported');
    }

    return amount * scale * 1000;
  }

  /**
   * Returns information about tf in form of object with
   * unit & amount properties. Where unit is a string & amount
   * a number
   * @param tf the input time frame (s,m,h,d,w,M,y)
   * @returns object with unit & amount properties
   */
  static getTfMetadata(tf: string): { unit: string; amount: number } {
    const splitTf = tf.split('');
    return {
      unit: splitTf.pop() ?? '',
      amount: +splitTf.join(''),
    };
  }

  static orderTFs(tfs: string[]) {
    const seconds: number[] = [];
    const minutes: number[] = [];
    const hours: number[] = [];
    const days: number[] = [];
    const weeks: number[] = [];
    const months: number[] = [];
    const years: number[] = [];
    tfs.forEach((tf) => {
      switch (tf.split('').pop()) {
        case 's':
          seconds.push(this.getTfMetadata(tf).amount);
          break;
        case 'm':
          minutes.push(this.getTfMetadata(tf).amount);
          break;
        case 'h':
          hours.push(this.getTfMetadata(tf).amount);
          break;
        case 'd':
          days.push(this.getTfMetadata(tf).amount);
          break;
        case 'w':
          weeks.push(this.getTfMetadata(tf).amount);
          break;
        case 'M':
          months.push(this.getTfMetadata(tf).amount);
          break;
        case 'y':
          years.push(this.getTfMetadata(tf).amount);
          break;
      }
    });

    return [
      ...seconds.sort((a, b) => a - b).map((u) => `${u}s`),
      ...minutes.sort((a, b) => a - b).map((u) => `${u}m`),
      ...hours.sort((a, b) => a - b).map((u) => `${u}h`),
      ...days.sort((a, b) => a - b).map((u) => `${u}d`),
      ...weeks.sort((a, b) => a - b).map((u) => `${u}w`),
      ...months.sort((a, b) => a - b).map((u) => `${u}M`),
      ...years.sort((a, b) => a - b).map((u) => `${u}y`),
    ];
  }
}
