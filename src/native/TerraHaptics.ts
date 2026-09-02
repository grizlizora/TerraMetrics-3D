import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { SheetSnap } from '../types';

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
  static async modeSwitched(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  static async sheetSnapped(snap: SheetSnap): Promise<void> {
    if (this.isNative) {
      try {
        const style = snap === 'full' ? ImpactStyle.Heavy : snap === 'half' ? ImpactStyle.Medium : ImpactStyle.Light;
        await Haptics.impact({ style });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(snap === 'full' ? 25 : snap === 'half' ? 15 : 8);
    }
  }

  static async categoryChanged(): Promise<void> {
    if (this.isNative) {
      try {
        await Haptics.selectionChanged();
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 20]);
    }
  }
}

export default TerraHaptics;
