export interface ContextRecoveryDelegate {
  onRestoreStyleAndLayers: () => void;
  onRestoreSpaceBridge?: () => void;
  onRefreshTheme?: () => void;
}
