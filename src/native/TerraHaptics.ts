import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class TerraHaptics {
  private static readonly isNative = Capacitor.isNativePlatform();

  static async lightImpact(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  static async mediumImpact(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  static async countrySelected(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  }

  static async selectionChanged(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.selectionChanged();
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  }

  static async success(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  }

  static async error(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Error });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
  }

  static async warning(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 30]);
    }
  }
}

export default TerraHaptics;
