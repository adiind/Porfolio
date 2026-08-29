export interface ProjectWheelItem {
  id: string;
  title: string;
  oneLiner: string;
  imageUrl: string;
  status: string;
}

export interface ProjectWheelRendererOptions {
  container: HTMLElement;
  items: ProjectWheelItem[];
  reducedMotion: boolean;
  onFrontIndexChange: (index: number) => void;
  onActivate: (index: number) => void;
  onReady: () => void;
  onFailure: (error: Error) => void;
}

export interface ProjectWheelRenderer {
  focusIndex(index: number, immediate?: boolean): void;
  step(delta: number, immediate?: boolean): void;
  getFrontIndex(): number;
  setActive(active: boolean): void;
  dispose(): void;
}
