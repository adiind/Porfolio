/**
 * Texture-atlas adaptation for Adi Agarwal's portfolio.
 * Based on Viscose by Yousuf Soomro, used under the MIT License.
 * The upstream demo artwork and fonts are not included.
 */
import * as THREE from 'three';
import type { ProjectWheelItem } from './projectWheelTypes';

const CELL_WIDTH = 512;
const CELL_HEIGHT = Math.round(CELL_WIDTH / 1.5);

const loadImage = (src: string, priority: 'high' | 'low') => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = priority;
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Unable to load project-wheel image: ${src}`));
  image.src = src;
});

export interface ProjectWheelAtlas {
  texture: THREE.CanvasTexture;
  grid: [number, number];
  count: number;
  first: Promise<void>;
  ready: Promise<void>;
}

export const buildProjectWheelAtlas = (
  items: ProjectWheelItem[],
  onProgress?: (progress: number) => void,
): ProjectWheelAtlas => {
  const columns = Math.ceil(Math.sqrt(items.length));
  const rows = Math.ceil(items.length / columns);
  const canvas = document.createElement('canvas');
  canvas.width = columns * CELL_WIDTH;
  canvas.height = rows * CELL_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Project-wheel texture canvas is unavailable.');

  context.fillStyle = '#10221c';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  const paint = (image: HTMLImageElement, index: number) => {
    const x = (index % columns) * CELL_WIDTH;
    const y = Math.floor(index / columns) * CELL_HEIGHT;
    const scale = Math.max(CELL_WIDTH / image.width, CELL_HEIGHT / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.save();
    context.beginPath();
    context.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
    context.clip();
    context.drawImage(image, x + (CELL_WIDTH - width) / 2, y + (CELL_HEIGHT - height) / 2, width, height);
    context.restore();
  };

  let settled = 0;
  const fetchInto = async (index: number, priority: 'high' | 'low') => {
    try {
      paint(await loadImage(items[index].imageUrl, priority), index);
    } catch (error) {
      console.warn('[project-wheel]', error instanceof Error ? error.message : error);
    } finally {
      settled += 1;
      onProgress?.(settled / items.length);
    }
  };

  const first = fetchInto(0, 'high').then(() => {
    texture.needsUpdate = true;
  });
  const ready = Promise.all([
    first,
    ...items.slice(1).map((_, index) => fetchInto(index + 1, 'low')),
  ]).then(() => {
    texture.needsUpdate = true;
  });

  onProgress?.(0);
  return { texture, grid: [columns, rows], count: items.length, first, ready };
};
