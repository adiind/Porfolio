/**
 * Something drawn into the flip-book engine's own scene, on the home stage's mat, beside the posters: it shares the
 * engine's camera, its window light and its one animation loop. The timeline on the mat is one (lib/mat/timelineLayer.ts).
 */
import type { PerspectiveCamera, Scene, Texture, Vector2, WebGLRenderer } from 'three';

export interface MatLayerContext {
  scene: Scene;
  renderer: WebGLRenderer;
  /** the window light, drawn small each frame (shaders.ts SUN_*), and the drawing buffer's size to read it with */
  sunTexture: Texture;
  screenSize: Vector2;
  /** the opening's light, 0 dark to 1 lit, shared by every material */
  dawn: { value: number };
  maxAnisotropy: number;
  /** ask for a frame (the loop sleeps while nothing moves) */
  invalidate(): void;
}

export interface MatLayer {
  /** Build its meshes into the scene. Called once, when the layer is added. */
  attach(ctx: MatLayerContext): void;
  /**
   * Every frame, after the camera has been placed for it (and on a frame drawn by hand: dt 0). `view` is the canvas's
   * size in CSS pixels. Returns true while it is moving, so the loop keeps going.
   */
  update(dt: number, camera: PerspectiveCamera, view: { width: number; height: number }): boolean;
  /** Take its meshes out of the scene and let go of what it holds. */
  dispose(): void;
}
