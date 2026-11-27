import {
  AmbientLight, Box3, CanvasTexture, CatmullRomCurve3, CircleGeometry, DirectionalLight,
  DoubleSide, Group, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
  RingGeometry, Shape, ShapeGeometry, SphereGeometry, SRGBColorSpace, Texture, TorusGeometry, TubeGeometry, Vector3,
  CylinderGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { NARROW, WIDE } from './rescueLayout';
import {
  ACCEPTED, CANCELLED, DELIVERED, DRIVER_STOPPED, gains, JOURNEY_END, JOURNEY_RATE, journeyAt, journeySteps, losses, neighbours as neighbourCopy,
  offer as offerCopy, OFFERS, PICKUP, REROUTED, REWARD_SETTLED_AT, type Tone,
} from './rescueJourney';

/** Where the map sits. The map is built in "local" coordinates and stretched in y (taller on a phone); the numbered pins and
 *  paper tags live outside the stretch so they are never squashed. world y = p + s * local y. */
const LAYOUT = {
  wide: { s: 1.45, p: .28, k: 1.12 / 229, off: 1, rMax: 1.15, bounds: WIDE.MAP },
  narrow: { s: 2.0, p: .02, k: 2.3 / 229, off: 1.8, rMax: 1.35, bounds: NARROW.MAP },
} as const;

const range = (time: number, from: number, to: number) => Math.min(1, Math.max(0, (time - from) / (to - from)));
const settle = (fraction: number) => 1 - (1 - fraction) ** 3;
const glide = (fraction: number) => fraction * fraction * (3 - 2 * fraction);
const TONE: Record<Tone, string> = { go: '#1f8a4c', stop: '#e23744', pay: '#b97a10' };
const PAPER = '#fbf6ea', INK = '#18204f';
const SS = 3; // canvases are drawn at 3x
const MARGIN = 8; // design px of soft shadow around every paper piece
const eventEnd = (index: number) => journeySteps[index + 1]?.at ?? JOURNEY_END;

/**
 * The streets: a small grid in the map's local coordinates. Two streets run across (Main, with the restaurant and the
 * first customer on it, and Lower, with the buyer on it) and three run between them. Every house fronts a street, and the
 * rider's routes run along them: out along Main, then down Cross to Lower.
 */
const MAIN_Y = -.05, LOWER_Y = -.63, WEST_X = 1.9, CROSS_X = 3.05, EAST_X = 4.25;
const STREET_WIDTH = .09; // table units, the same whichever way a street runs
const shopPoint = new Vector3(1.95, .14, 0);
const originalHome = new Vector3(4.6, .24, 0);
const nextDoor = new Vector3(3.95, .34, 0);
const farHome = new Vector3(2.35, -.45, 0);
const receiver = new Vector3(3.55, -.45, 0);
const radarOrigin = new Vector3(CROSS_X, MAIN_Y, 0);
/** the no-offer zone: a circle on the mat (radius in table units) around the first customer and the house next to it */
const zone = { x: (originalHome.x + nextDoor.x) / 2, y: (originalHome.y + nextDoor.y) / 2, r: .74 };

/** The rider: Adi's approved Tripo model, slimmed from 221,000 to 40,000 triangles (it is drawn about 60 px tall). */
const RIDER_MODEL = '/images/mat/food-rescue/rider.glb';

export function createRescueScene(parent: Group, bagModel: Group, invalidate: () => void, reduced: boolean) {
  const root = new Group();
  root.visible = false;
  parent.add(root);
  const map = new Group();
  root.add(map);
  const overlay = new Group(); // pins and paper tags: not stretched
  root.add(overlay);
  const disposables: { dispose(): void }[] = [];
  root.add(new AmbientLight('#f4f5ff', 1.65));
  const light = new DirectionalLight('#fff2da', 2.1);
  light.position.set(2, 3, 5);
  root.add(light);

  const clay = (color: string, roughness = .83, metalness = 0) => {
    const material = new MeshStandardMaterial({ color, roughness, metalness });
    disposables.push(material);
    return material;
  };
  const place = (object: Group | Mesh, x: number, y: number, z: number, into = map) => {
    object.position.set(x, y, z);
    into.add(object);
  };
  const block = (
    into: Group, material: MeshStandardMaterial,
    w: number, d: number, h: number, x: number, y: number, z: number, radius = .012,
  ) => {
    const geometry = new RoundedBoxGeometry(w, d, h, 2, radius);
    disposables.push(geometry);
    const mesh = new Mesh(geometry, material);
    place(mesh, x, y, z, into);
    return mesh;
  };
  const ink = clay('#243c54');
  const cream = clay('#fff3d8');
  const wood = clay('#824835');
  const trim = clay('#eed1a2');
  const red = clay('#d8404c');
  const leaf = clay('#578b65');
  const teal = clay('#8bf6be');

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowInk = shadowCanvas.getContext('2d')!;
  const gradient = shadowInk.createRadialGradient(32, 32, 5, 32, 32, 30);
  gradient.addColorStop(0, '#081d4f99');
  gradient.addColorStop(.65, '#081d4f48');
  gradient.addColorStop(1, '#081d4f00');
  shadowInk.fillStyle = gradient;
  shadowInk.fillRect(0, 0, 64, 64);
  const shadowMap = new CanvasTexture(shadowCanvas);
  shadowMap.colorSpace = SRGBColorSpace;
  const shadowMaterial = new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
  const shadowGeometry = new PlaneGeometry(1, 1);
  disposables.push(shadowMap, shadowMaterial, shadowGeometry);
  const shadows: { mesh: Mesh; w: number; h: number }[] = [];
  const shadow = (x: number, y: number, w: number, h: number) => {
    const mesh = new Mesh(shadowGeometry, shadowMaterial);
    place(mesh, x - .02, y - .025, .005);
    shadows.push({ mesh, w, h });
    return mesh;
  };

  const buildings: { group: Group; scale: number }[] = [];
  const house = (point: Vector3, wallColor: string, roofColor: string, scale: number, shop = false) => {
    const house = new Group();
    place(house, point.x, point.y, 0);
    house.scale.setScalar(scale);
    buildings.push({ group: house, scale });
    const walls = clay(wallColor);
    const roof = clay(roofColor);
    const glass = clay('#ffcf7a');
    block(house, trim, .40, .34, .031, 0, -.017, .019);
    block(house, walls, .34, .267, .235, 0, .006, .144);
    block(house, roof, .372, .282, .038, 0, .008, .262);
    for (const x of [-.151, .151]) block(house, roof, .038, .257, .035, x, .005, .294);
    block(house, roof, .30, .030, .036, 0, .124, .294);
    block(house, wood, .071, .024, .132, 0, -.139, .095);
    block(house, trim, .094, .053, .022, 0, -.159, .04);
    for (const x of [-.103, .103]) {
      block(house, wood, .082, .019, .078, x, -.132, .161, .006);
      block(house, glass, .067, .012, .062, x, -.145, .161, .004);
      block(house, wood, .007, .012, .059, x, -.154, .161, .002);
      block(house, wood, .063, .013, .007, x, -.154, .161, .002);
      block(house, trim, .088, .027, .012, x, -.15, .117, .004);
    }
    if (shop) {
      for (let i = 0; i < 7; i++) {
        const strip = block(house, i % 2 ? cream : red, .048, .122, .020, (i - 3) * .047, -.161, .222, .008);
        strip.rotation.x = .34;
      }
      block(house, red, .204, .021, .032, 0, -.144, .27, .006);
    } else {
      block(house, trim, .094, .109, .065, .076, .034, .312);
      block(house, wood, .085, .096, .012, .076, .034, .354, .005);
      block(house, roof, .145, .041, .015, -.041, -.157, .212, .006);
      for (const x of [-.145, .146]) {
        block(house, roof, .041, .044, .045, x, -.139, .052, .006);
        block(house, leaf, .042, .045, .053, x, -.137, .090, .02);
      }
    }
    return { group: house, walls, roof };
  };
  const SHOP_SCALE = 1.3;
  const { group: shop } = house(shopPoint, '#e69765', '#ad5043', SHOP_SCALE, true);
  const shopShadow = shadow(shopPoint.x, shopPoint.y, .65, .48);
  const original = house(originalHome, '#edcb9d', '#be715b', 1.3);
  original.roof.emissive.set('#ff202f');
  original.walls.emissive.set('#ff202f');
  shadow(originalHome.x, originalHome.y, .68, .50);
  const reachGeometry = new RingGeometry(.255, .28, 48);
  disposables.push(reachGeometry);
  const neighbourSpec = [
    { id: 'far', point: farHome, walls: '#d6b6c9', roof: '#84628b' },
    { id: 'nextDoor', point: nextDoor, walls: '#a9c6dd', roof: '#587591' },
    { id: 'buyer', point: receiver, walls: '#a7c8a7', roof: '#536c58' },
  ] as const;
  const neighbours = neighbourSpec.map(({ id, point, walls, roof }) => {
    const building = house(point, walls, roof, 1.05);
    shadow(point.x, point.y, .54, .44);
    const reachedColor = new MeshBasicMaterial({ color: '#8cffa4', transparent: true, depthWrite: false });
    disposables.push(reachedColor);
    const reached = new Mesh(reachGeometry, reachedColor);
    place(reached, point.x, point.y, .04);
    return { id, point, building, reached };
  });
  const [far, door, buyer] = neighbours;
  buyer.building.roof.emissive.set('#27ff64');
  buyer.building.walls.emissive.set('#27ff64');
  void door;

  /** the little Food Rescue bag: one on the far house, one on the buyer's, and the real meal itself */
  const farBag = bagModel.clone(true);
  const offerBag = bagModel.clone(true);
  const mealBag = bagModel.clone(true);
  for (const bag of [farBag, offerBag, mealBag]) { bag.visible = false; map.add(bag); }

  const curve = (points: number[][], z: number) => new CatmullRomCurve3(points.map(([x, y]) => new Vector3(x, y, z)));
  // the rider's three legs, each straight along a street
  const firstLeg = curve([[2.05,MAIN_Y],[2.4,MAIN_Y],[2.8,MAIN_Y],[CROSS_X,MAIN_Y]], .017);
  const cancelledLeg = curve([[CROSS_X,MAIN_Y],[3.6,MAIN_Y],[4.1,MAIN_Y],[4.6,MAIN_Y]], .017);
  const secondLeg = curve([[CROSS_X,MAIN_Y],[CROSS_X,-.24],[CROSS_X,-.44],[CROSS_X,LOWER_Y]], .023);
  const tube = (route: CatmullRomCurve3, radius: number, material: MeshBasicMaterial) => {
    const geometry = new TubeGeometry(route, 72, radius, 8, false);
    disposables.push(geometry);
    const mesh = new Mesh(geometry, material);
    map.add(mesh);
    return mesh;
  };
  // The streets are painted on one flat sheet lying on the mat, outside the map's stretch: painted once for the wide
  // layout and once for the tall one, so a street is the same width whichever way it runs and crossings are drawn once.
  const streetSheet = (() => {
    const material = new MeshBasicMaterial({ transparent: true, opacity: .5, depthWrite: false });
    const geometry = new PlaneGeometry(1, 1);
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = -1; // under the routes, rings, shadows and paper
    root.add(mesh);
    const paint = (lay: (typeof LAYOUT)[keyof typeof LAYOUT]) => {
      const b = lay.bounds, ppu = 420; // canvas px per table unit
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((b.x1 - b.x0) * ppu); canvas.height = Math.round((b.y1 - b.y0) * ppu);
      const g = canvas.getContext('2d')!;
      const X = (x: number) => (x - b.x0) * ppu, Y = (y: number) => (b.y1 - (lay.p + lay.s * y)) * ppu;
      const lines = (segments: number[][]) => { g.beginPath(); for (const [x0, y0, x1, y1] of segments) { g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)); } g.stroke(); };
      const grid = [
        [b.x0 - .2, MAIN_Y, b.x1 + .2, MAIN_Y], [WEST_X, LOWER_Y, b.x1 + .2, LOWER_Y],
        [WEST_X, MAIN_Y, WEST_X, LOWER_Y], [CROSS_X, MAIN_Y, CROSS_X, LOWER_Y], [EAST_X, MAIN_Y, EAST_X, LOWER_Y],
      ];
      g.lineCap = 'round'; g.lineJoin = 'round';
      // the roadway: one pale band (every street in one stroke, so crossings are not painted twice)
      g.strokeStyle = 'rgba(206,226,255,.62)'; g.lineWidth = STREET_WIDTH * ppu; lines(grid);
      // the path from Main to the door of the house that is set back from it
      g.lineWidth = STREET_WIDTH * .55 * ppu; lines([[nextDoor.x, MAIN_Y, nextDoor.x, nextDoor.y - .16]]);
      // a dashed centre line, as on a street map
      g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = .011 * ppu; g.lineCap = 'butt'; g.setLineDash([.06 * ppu, .055 * ppu]); lines(grid);
      g.setLineDash([]);
      // the streets run on out of the map: they fade at its left and right edges
      g.globalCompositeOperation = 'destination-in';
      const fade = g.createLinearGradient(0, 0, canvas.width, 0);
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(.07, 'rgba(0,0,0,1)'); fade.addColorStop(.93, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fade; g.fillRect(0, 0, canvas.width, canvas.height);
      return { tex: texture(canvas), b };
    };
    let variants: ReturnType<typeof paint>[] | null = null;
    let showing = -1;
    disposables.push(material, geometry, { dispose: () => variants?.forEach(v => v.tex.dispose()) });
    return {
      use(narrow: boolean) {
        variants ??= [paint(LAYOUT.wide), paint(LAYOUT.narrow)];
        const i = narrow ? 1 : 0;
        if (i === showing) return;
        showing = i;
        const { tex, b } = variants[i];
        material.map = tex; material.needsUpdate = true;
        mesh.scale.set(b.x1 - b.x0, b.y1 - b.y0, 1);
        mesh.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, .004);
      },
    };
  })();
  const routeGlow = (path: CatmullRomCurve3, color: string) => {
    const core = new MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    const halo = new MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    disposables.push(core, halo);
    return { core: tube(path, .014, core), halo: tube(path, .031, halo) };
  };
  const travelled = routeGlow(firstLeg, '#9bffc3');
  const missed = routeGlow(cancelledLeg, '#9bffc3');
  const cancellationTrail = routeGlow(cancelledLeg, '#ff5368');
  cancellationTrail.core.position.z = .009;
  cancellationTrail.halo.position.z = .009;
  const detour = routeGlow(secondLeg, '#91ffb0');
  const pulseGeometry = new SphereGeometry(.035, 12, 8);
  const pulseMaterial = new MeshBasicMaterial({ color: '#ffdadd' });
  disposables.push(pulseGeometry, pulseMaterial);
  const pulse = new Mesh(pulseGeometry, pulseMaterial);
  map.add(pulse);

  // the green offer wave: a circle on the mat (undone from the map's stretch in pose)
  const waveStart = [.06, .47].map(f => f * (ACCEPTED - OFFERS));
  const waveLife = .42 * (ACCEPTED - OFFERS);
  const radar = waveStart.map(() => {
    const geometry = new RingGeometry(.965, 1, 80);
    const material = new MeshBasicMaterial({ color: '#57ff91', transparent: true, side: DoubleSide, depthWrite: false });
    disposables.push(geometry, material);
    const mesh = new Mesh(geometry, material);
    place(mesh, radarOrigin.x, radarOrigin.y, .034);
    return mesh;
  });
  // the red ring around the rider when the cancel signal reaches it
  const stopGeometry = new RingGeometry(.9, 1, 48);
  const stopMaterial = new MeshBasicMaterial({ color: '#e23744', transparent: true, side: DoubleSide, depthWrite: false });
  const stopRing = new Mesh(stopGeometry, stopMaterial);
  disposables.push(stopGeometry, stopMaterial);
  map.add(stopRing);

  // the no-offer zone: a dashed red ring around the first customer's house and the house next to it
  const zoneGroup = new Group();
  place(zoneGroup, zone.x, zone.y, .03);
  const dashes = 34;
  const dashGeometry = new RingGeometry(1 - .03 / zone.r, 1, 6, 1, 0, Math.PI * 2 / dashes * .56);
  const zoneMaterial = new MeshBasicMaterial({ color: '#e23744', transparent: true, depthWrite: false });
  const zoneFillGeometry = new CircleGeometry(1, 64);
  const zoneFillMaterial = new MeshBasicMaterial({ color: '#e23744', transparent: true, depthWrite: false });
  disposables.push(dashGeometry, zoneMaterial, zoneFillGeometry, zoneFillMaterial);
  const zoneFill = new Mesh(zoneFillGeometry, zoneFillMaterial);
  zoneFill.position.z = -.012;
  zoneGroup.add(zoneFill);
  const zoneDashes: Mesh[] = [];
  for (let i = 0; i < dashes; i++) {
    const dash = new Mesh(dashGeometry, zoneMaterial);
    dash.rotation.z = i / dashes * Math.PI * 2;
    zoneGroup.add(dash);
    zoneDashes.push(dash);
  }

  const disc = (radius: number, thickness: number, material: MeshStandardMaterial, into: Group) => {
    const geometry = new CylinderGeometry(radius, radius, thickness, 56, 1);
    disposables.push(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    into.add(mesh);
    return mesh;
  };
  const badge = (x: number, y: number, z: number) => {
    const group = new Group();
    group.rotation.x = .62;
    place(group, x, y, z);
    return group;
  };
  const stroke = (into: Group, ax: number, ay: number, bx: number, by: number, material: MeshStandardMaterial) => {
    const segment = block(into, material, Math.hypot(bx - ax, by - ay) + .012, .020, .012, (ax + bx) / 2, (ay + by) / 2, .024, .005);
    segment.rotation.z = Math.atan2(by - ay, bx - ax);
  };
  const check = (into: Group, material: MeshStandardMaterial) => {
    stroke(into, -.043, -.003, -.014, -.032, material);
    stroke(into, -.014, -.032, .046, .033, material);
  };

  // the buyer's round timer, which fills while the offer is open and then shows a tick
  const confirmation = new Group();
  root.add(confirmation);
  const greenInk = clay('#1f8a4c');
  const timerPaper = new MeshBasicMaterial({ color: '#fbf6ea' });
  const timerTrack = new MeshBasicMaterial({ color: '#cfe0d2' });
  const timerFill = new MeshBasicMaterial({ color: '#1f8a4c', side: DoubleSide });
  const timerDisc = new CylinderGeometry(.088, .088, .02, 48, 1);
  const timerTrackGeometry = new RingGeometry(.056, .076, 48);
  const progressGeometry = new RingGeometry(.056, .076, 60, 1, Math.PI / 2, -Math.PI * 2); // clockwise from the top
  disposables.push(timerPaper, timerTrack, timerFill, timerDisc, timerTrackGeometry, progressGeometry);
  const timerFace = new Mesh(timerDisc, timerPaper);
  timerFace.rotation.x = Math.PI / 2;
  confirmation.add(timerFace);
  place(new Mesh(timerTrackGeometry, timerTrack), 0, 0, .0115, confirmation);
  const progressRing = new Mesh(progressGeometry, timerFill);
  place(progressRing, 0, 0, .0135, confirmation);
  const accepted = new Group();
  accepted.position.z = -.01;
  accepted.scale.setScalar(.8);
  confirmation.add(accepted);
  check(accepted, greenInk);

  const gold = clay('#efad35', .27, .36);
  const goldEdge = clay('#ffcf63', .31, .26);
  const coin = badge(radarOrigin.x, radarOrigin.y, .34);
  root.add(coin);
  disc(.093, .029, gold, coin);
  const rimGeometry = new TorusGeometry(.079, .008, 8, 48);
  disposables.push(rimGeometry);
  for (const side of [-1, 1]) place(new Mesh(rimGeometry, goldEdge), 0, 0, side * .016, coin);
  const starOutline = new Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 ? .024 : .048;
    if (i === 0) starOutline.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else starOutline.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  starOutline.closePath();
  const starGeometry = new ShapeGeometry(starOutline);
  disposables.push(starGeometry);
  place(new Mesh(starGeometry, cream), 0, 0, .017, coin);

  const rider = new Group();
  const heading = new Group();
  rider.add(heading);
  map.add(rider);
  const riderShadow = shadow(0, 0, .31, .20);
  // Keep the route legible even when the rider asset arrives late or fails.
  const riderMarker = block(heading, red, .105, .17, .071, 0, 0, .07, .027);
  const markerStripe = block(heading, cream, .08, .025, .014, 0, .024, .111, .006);
  let disposed = false;
  // The rider's model (782 KB) is fetched the first time Food Rescue is opened, never with the page. Until it is in,
  // and if it never arrives, the red marker above stands for the rider.
  let riderAsked = false;
  const loadRider = () => { if (riderAsked) return; riderAsked = true; void import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => new GLTFLoader().loadAsync(RIDER_MODEL)).then(({ scene }) => {
    const seen = new Set<object>();
    scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const resource of [object.geometry, ...materials, ...materials.flatMap(material => Object.values(material).filter(value => value instanceof Texture))]) {
        if (!seen.has(resource)) {
          disposables.push(resource);
          seen.add(resource);
        }
      }
    });
    if (disposed) { disposables.splice(0).forEach(resource => resource.dispose()); return; }
    const bounds = new Box3().setFromObject(scene);
    const scale = .192 / bounds.getSize(new Vector3()).y;
    const centre = bounds.getCenter(new Vector3());
    scene.scale.setScalar(scale);
    scene.position.set(-centre.x * scale, -bounds.min.y * scale, -centre.z * scale);
    const upright = new Group();
    upright.rotation.x = Math.PI / 2;
    upright.add(scene);
    heading.add(upright);
    riderMarker.visible = false;
    markerStripe.visible = false;
    invalidate();
  }).catch(() => { /* The route marker continues representing the rider. */ }); };

  // ---- numbered pins and paper tags (canvas textures, drawn at 3x) ----
  const measure = document.createElement('canvas').getContext('2d')!;
  const paper = new PlaneGeometry(1, 1);
  disposables.push(paper);
  const redraws: (() => void)[] = [];
  const texture = (canvas: HTMLCanvasElement) => {
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.minFilter = LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = 16;
    return map;
  };
  const pieces: { use(narrow: boolean): void }[] = [];
  /** a paper piece drawn twice: once for the wide layout and once for the phone (where long tags wrap) */
  const paperPiece = (draw: (narrow: boolean) => HTMLCanvasElement) => {
    const material = new MeshBasicMaterial({ transparent: true, depthWrite: false });
    const mesh = new Mesh(paper, material);
    mesh.visible = false;
    mesh.renderOrder = 20; // paper lies over the roads, routes and rings, whatever the sort order says
    overlay.add(mesh);
    const variants: { tex: CanvasTexture; w: number; h: number }[] = [];
    const piece = {
      mesh, material, w: 1, h: 1, narrow: false,
      use(narrow: boolean) {
        piece.narrow = narrow;
        const v = variants[narrow ? 1 : 0];
        if (material.map !== v.tex) material.map = v.tex;
        piece.w = v.w; piece.h = v.h;
      },
    };
    const redraw = () => {
      [false, true].forEach((narrow, i) => {
        const canvas = draw(narrow);
        variants[i]?.tex.dispose();
        variants[i] = { tex: texture(canvas), w: canvas.width / SS - 2 * MARGIN, h: canvas.height / SS - 2 * MARGIN };
      });
      material.needsUpdate = true;
      piece.use(piece.narrow);
    };
    redraw();
    redraws.push(redraw);
    pieces.push(piece);
    disposables.push(material, { dispose: () => variants.forEach(v => v.tex.dispose()) });
    return piece;
  };
  const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  };
  const wrap = (text: string, maxWidth: number) => {
    measure.font = '700 15px "FB Geist", sans-serif';
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const trial = line ? line + ' ' + word : word;
      if (line && measure.measureText(trial).width > maxWidth) { lines.push(line); line = word; } else line = trial;
    }
    lines.push(line);
    return lines;
  };
  /** a small cream paper tag with a coloured dot (the look of drawRoleTag in main.ts) */
  const makeTag = (text: string, tone: Tone, narrowMax = 118, wideMax = 1e6) => paperPiece(narrow => {
    const lines = wrap(text, narrow ? narrowMax : wideMax);
    const textWidth = Math.max(...lines.map(line => measure.measureText(line).width));
    const w = Math.ceil(26 + textWidth + 12), h = lines.length === 1 ? 31 : 14 + 18 * lines.length;
    const canvas = document.createElement('canvas');
    canvas.width = (w + 2 * MARGIN) * SS;
    canvas.height = (h + 2 * MARGIN) * SS;
    const g = canvas.getContext('2d')!;
    g.scale(SS, SS);
    g.shadowColor = 'rgba(8,29,79,.34)'; g.shadowBlur = 7; g.shadowOffsetY = 3;
    g.fillStyle = PAPER; roundRect(g, MARGIN, MARGIN, w, h, 8); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(24,32,79,.10)'; g.lineWidth = 1; roundRect(g, MARGIN + .5, MARGIN + .5, w - 1, h - 1, 8); g.stroke();
    g.fillStyle = TONE[tone]; g.beginPath(); g.arc(MARGIN + 13, MARGIN + (lines.length === 1 ? h / 2 : 16), 4.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.font = '700 15px "FB Geist", sans-serif'; g.textBaseline = 'middle';
    lines.forEach((line, i) => g.fillText(line, MARGIN + 26, MARGIN + (lines.length === 1 ? h / 2 + .5 : 16 + 18 * i + .5)));
    return canvas;
  });
  const PIN = 34;
  /** a round paper disc with the event number printed on it */
  const makePin = (n: string, tone: Tone) => paperPiece(() => {
    const size = PIN + 2 * MARGIN;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size * SS;
    const g = canvas.getContext('2d')!;
    g.scale(SS, SS);
    g.shadowColor = 'rgba(8,29,79,.38)'; g.shadowBlur = 7; g.shadowOffsetY = 3;
    g.fillStyle = TONE[tone]; g.beginPath(); g.arc(size / 2, size / 2, PIN / 2, 0, Math.PI * 2); g.fill();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(size / 2, size / 2, PIN / 2 - 3, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#fff'; g.font = '800 17px "FB Bricolage", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(n, size / 2, size / 2 + 1);
    return canvas;
  });
  void Promise.all([document.fonts.load('700 20px "FB Geist"'), document.fonts.load('800 20px "FB Bricolage"')])
    .then(() => { if (!disposed) { redraws.forEach(redraw => redraw()); invalidate(); } }).catch(() => { /* system font stays */ });

  // where each event happens: local map point + a nudge in world units (wide), so the pin never hides a house front
  const legMid = firstLeg.getPointAt(.5), detourMid = secondLeg.getPointAt(.3);
  const pinSpec = [
    { ax: shopPoint.x, ay: shopPoint.y, ox: 0, oy: .42 },
    { ax: legMid.x, ay: legMid.y, ox: -.05, oy: .3 },
    { ax: originalHome.x, ay: originalHome.y, ox: 0, oy: .42 },
    { ax: radarOrigin.x, ay: radarOrigin.y, ox: -.1, oy: .4 },
    { ax: receiver.x, ay: receiver.y, ox: -.14, oy: .3 },
    { ax: detourMid.x, ay: detourMid.y, ox: -.2, oy: 0 },
    { ax: receiver.x, ay: receiver.y, ox: .33, oy: -.1 },
  ];
  const pins = journeySteps.map((step, i) => ({ ...makePin(step.n, step.tone), ...pinSpec[i], x: 0, y: 0 }));
  const eventTags = journeySteps.map((step, i) => makeTag(step.tag, step.tone, i === 5 ? 70 : 118));
  const lossTags = losses.map(loss => makeTag(loss.text, 'stop'));
  const outcome = (id: string) => neighbourCopy.find(n => n.id === id)!;
  const offeredTag = makeTag(outcome('far').tag, 'go');
  const skippedTag = makeTag(outcome('nextDoor').tag, 'stop', 90);
  const priceTag = makeTag(offerCopy.priceTag, 'pay', 74);
  const gainTags = gains.map(gain => makeTag(gain.short, 'go'));
  type Piece = (typeof eventTags)[number];

  const narration = document.createElement('div');
  narration.className = 'rescue-narration';
  // (read by screen readers only: it never shows)
  narration.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
  narration.setAttribute('aria-live', 'polite');
  document.body.append(narration);

  const point = new Vector3(), tangent = new Vector3(), endPoint = new Vector3();
  const drawRoute = (route: ReturnType<typeof routeGlow>, fraction: number, opacity: number, reverse = false) => {
    const total = 72 * 8 * 6;
    const count = Math.floor(72 * fraction) * 8 * 6;
    const start = reverse ? total - count : 0;
    route.core.geometry.setDrawRange(start, count);
    route.halo.geometry.setDrawRange(start, count);
    route.core.material.opacity = opacity;
    route.halo.material.opacity = opacity * .33;
  };
  const eased = (time: number, from: number, to: number) => glide(range(time, from, to));

  let time = 0;
  let step = -1;
  let narrowNow = false;
  const pose = (seconds: number, narrow = narrowNow) => {
    narrowNow = narrow;
    const lay = narrow ? LAYOUT.narrow : LAYOUT.wide;
    const stretch = lay.s;
    const lean = (narrow ? NARROW : WIDE).FRAME.pitch * .9; // pins and tags lean to face the camera
    const hs = narrow ? 1.1 : 1; // houses a little bigger on a phone
    const wy = (y: number) => lay.p + stretch * y; // local y to world y
    map.scale.y = stretch;
    map.position.y = lay.p;
    for (const { group, scale } of buildings) group.scale.set(scale * hs, scale * hs / stretch, scale * hs);
    for (const { mesh, w, h } of shadows) mesh.scale.set(w * hs, h * hs / stretch, 1);
    const shopEntrance = settle(range(seconds, .06, .8));
    shop.position.set(shopPoint.x - (1 - shopEntrance) * .17, shopPoint.y, .085 * Math.sin(Math.PI * shopEntrance));
    const shopScale = SHOP_SCALE * hs * (.72 + .28 * shopEntrance);
    shop.scale.set(shopScale, shopScale / stretch, shopScale);
    shopShadow.visible = shopEntrance > .1;

    // ---- who is where, derived from the clock alone ----
    const driveFirst = eased(seconds, PICKUP + .4, CANCELLED - .05);
    const driveSecond = eased(seconds, REROUTED + .35, DELIVERED - .12);
    const drivingAway = seconds >= REROUTED;
    const route = drivingAway ? secondLeg : firstLeg;
    const travel = drivingAway ? driveSecond : driveFirst;
    route.getPointAt(travel, point);
    route.getTangentAt(travel, tangent);
    rider.position.copy(point);
    heading.rotation.z = Math.atan2(tangent.y * stretch, tangent.x) - Math.PI / 2;
    const arrive = settle(range(seconds, PICKUP, PICKUP + .3));
    const riderScale = (narrow ? 1.9 : 1.62) * (.55 + .45 * arrive);
    rider.scale.set(riderScale, riderScale / stretch, riderScale);
    rider.visible = seconds >= PICKUP;
    riderShadow.position.set(point.x - .022, point.y - .025, .006);
    riderShadow.visible = rider.visible;

    // route lines: green behind the rider, planned road ahead, red when the cancel signal runs back
    const cancelRun = eased(seconds, CANCELLED + .2, CANCELLED + .2 + .46 * (OFFERS - CANCELLED));
    const plannedAhead = settle(range(seconds, PICKUP + .3, PICKUP + .3 + .6 * (CANCELLED - PICKUP)));
    const redAlert = seconds >= CANCELLED ? 1 - .72 * range(seconds, DRIVER_STOPPED, OFFERS + .45) : 0;
    original.roof.emissiveIntensity = seconds >= CANCELLED ? Math.min(1, range(seconds, CANCELLED, CANCELLED + .25) * 1) * redAlert : 0;
    original.walls.emissiveIntensity = original.roof.emissiveIntensity * .85;
    // the planned route is plotted in one go from the shop to the first address (first leg, then the leg beyond the
    // stop), so there is never a gap between the rider and the line ahead of it
    drawRoute(travelled, Math.max(driveFirst, Math.min(1, plannedAhead * 2)), 1 - .57 * cancelRun);
    drawRoute(missed, Math.max(0, plannedAhead * 2 - 1) * (1 - cancelRun), 1);
    drawRoute(cancellationTrail, cancelRun, .34 + .66 * redAlert, true);
    pulse.visible = cancelRun > 0 && cancelRun < 1;
    cancelledLeg.getPointAt(1 - cancelRun, pulse.position);
    pulse.position.z += .064;
    // the detour is drawn faintly as soon as the claim is made, then lit when the rider takes it
    drawRoute(detour, seconds < REROUTED ? settle(range(seconds, ACCEPTED + .45, REROUTED - .25)) : 1,
      .38 + .62 * settle(range(seconds, REROUTED, REROUTED + .5)));
    const stopAt = CANCELLED + .2 + .46 * (OFFERS - CANCELLED);
    const ringGrow = range(seconds, stopAt, stopAt + .6);
    stopRing.visible = seconds >= stopAt && ringGrow < 1 && seconds < REROUTED;
    stopRing.position.set(radarOrigin.x, radarOrigin.y, .03);
    stopRing.scale.set(.14 + .22 * settle(ringGrow), (.14 + .22 * settle(ringGrow)) / stretch, 1);
    stopMaterial.opacity = .85 * (1 - ringGrow);

    // ---- event 04: the offer wave goes out twice; the no-offer zone holds it back from the cancelling customer's side ----
    const speed = lay.rMax / waveLife;
    const distance = (p: Vector3) => Math.hypot(p.x - radarOrigin.x, (p.y - radarOrigin.y) * stretch);
    radar.forEach((ring, index) => {
      const elapsed = seconds - OFFERS - waveStart[index];
      ring.visible = elapsed > 0 && elapsed < waveLife;
      const radius = Math.max(.001, elapsed * speed);
      ring.scale.set(radius, radius / stretch, 1);
      ring.material.opacity = .85 * (1 - range(elapsed, waveLife * .6, waveLife));
    });
    const arrivalOf = (p: Vector3) => OFFERS + waveStart[0] + (distance(p) - .08) / speed;
    const arrivalFar = arrivalOf(far.point), arrivalDoor = arrivalOf(door.point), arrivalBuyer = arrivalOf(buyer.point);
    const zoneIn = range(seconds, OFFERS, OFFERS + .5);
    const zoneOut = 1 - .55 * range(seconds, ACCEPTED, ACCEPTED + .4);
    zoneGroup.visible = zoneIn > 0 && zoneOut > 0;
    zoneGroup.scale.set(zone.r, zone.r / stretch, 1);
    zoneMaterial.opacity = .92 * zoneOut;
    zoneFillMaterial.opacity = .10 * zoneOut * zoneIn;
    zoneDashes.forEach((dash, i) => { dash.visible = i < Math.ceil(zoneIn * dashes); });

    const farHit = settle(range(seconds, arrivalFar, arrivalFar + .26));
    const farGone = 1 - settle(range(seconds, ACCEPTED, ACCEPTED + .3));
    far.reached.visible = farHit > 0 && farGone > 0;
    far.reached.scale.set(1, 1 / stretch, 1);
    far.reached.material.opacity = .72 * farHit * farGone;
    buyer.reached.visible = seconds >= arrivalBuyer;
    buyer.reached.scale.set(1, 1 / stretch, 1);
    buyer.reached.material.opacity = seconds >= ACCEPTED ? .96 : .72 * settle(range(seconds, arrivalBuyer, arrivalBuyer + .26));
    door.reached.visible = false;
    const claimed = settle(range(seconds, ACCEPTED, ACCEPTED + .26));
    buyer.building.roof.emissiveIntensity = claimed * .2;
    buyer.building.walls.emissiveIntensity = claimed * .17;

    // bags
    const bagScale = narrow ? .35 : .32;
    const bagAt = (bag: Group, x: number, y: number, z: number, size: number) => {
      bag.position.set(x, y, z);
      bag.scale.set(size, size / stretch, size);
    };
    const slot = .22 / stretch;
    const farPop = settle(range(seconds, arrivalFar + .05, arrivalFar + .35));
    farBag.visible = farPop > 0 && farGone > 0;
    bagAt(farBag, far.point.x, far.point.y - slot, .26 + .1 * farPop, bagScale * (.7 + .3 * farPop) * .9 * farGone);
    const buyerPop = settle(range(seconds, arrivalBuyer + .05, arrivalBuyer + .35));
    offerBag.visible = buyerPop > 0 && seconds < DELIVERED;
    bagAt(offerBag, receiver.x, receiver.y - slot, .24 + .13 * Math.max(buyerPop * .6, claimed), bagScale * (.7 + .3 * buyerPop));
    // the real meal: cooked at the shop, taken by the rider, handed over at the new door
    const cooked = settle(range(seconds, .75, 1.55));
    const taken = glide(range(seconds, PICKUP + .2, PICKUP + .7));
    const handoff = settle(range(seconds, DELIVERED, REWARD_SETTLED_AT));
    mealBag.visible = (cooked > 0 && taken < 1) || seconds >= DELIVERED;
    if (seconds < DELIVERED) {
      const sx = shopPoint.x + .05, sy = shopPoint.y - .2 / stretch;
      const x = sx + (point.x - sx) * taken, y = sy + (point.y - sy) * taken;
      bagAt(mealBag, x, y, .04 + .2 * cooked * (1 - taken) + .1 * taken, bagScale * 1.25 * (.5 + .5 * cooked) * (1 - taken * .9));
    } else {
      bagAt(mealBag, point.x + (receiver.x - point.x) * handoff, point.y + (receiver.y - slot - point.y) * handoff,
        .22 - .17 * handoff, bagScale * (.4 + .6 * handoff));
    }

    // the buyer's round timer fills until the claim, then ticks; the rider's coin lands at the reroute
    confirmation.visible = seconds >= arrivalBuyer && seconds < REROUTED;
    progressGeometry.setDrawRange(0, Math.floor(60 * range(seconds, arrivalBuyer, ACCEPTED - .05)) * 6);
    accepted.visible = seconds >= ACCEPTED;
    const timerScale = narrow ? 1.25 : 1;
    // touching the buyer's house on its right-hand side
    confirmation.position.set(receiver.x + .21 * hs + .092 * timerScale, wy(receiver.y) + .03, .17);
    confirmation.rotation.x = lean;
    confirmation.scale.setScalar(timerScale);
    coin.visible = seconds >= REROUTED;
    const reward = settle(range(seconds, REROUTED, REROUTED + .36));
    coin.position.set(point.x + (narrow ? .3 : .2), wy(point.y) + (narrow ? -.08 : 0), .16 + .2 * reward);
    coin.rotation.y = (1 - reward) * Math.PI / 2 + .20;
    coin.scale.setScalar(narrow ? 1.25 : 1);

    // ---- numbered pins and paper tags (outside the stretch) ----
    for (const piece of pieces) piece.use(narrow);
    streetSheet.use(narrow);
    const kT = lay.k, rPin = PIN / 2 * kT;
    pins.forEach((pin, i) => {
      const at = journeySteps[i].at;
      const e = settle(range(seconds, at, at + .3));
      pin.mesh.visible = seconds >= at;
      pin.x = pin.ax + pin.ox * lay.off;
      pin.y = wy(pin.ay) + pin.oy * lay.off;
      const size = (PIN + 2 * MARGIN) * kT * (.6 + .4 * e);
      pin.mesh.scale.set(size, size, 1);
      pin.mesh.rotation.x = lean;
      pin.mesh.position.set(pin.x, pin.y, .03 + rPin * Math.sin(lean) + (1 - e) * .16);
      pin.material.opacity = e;
    });
    /** show a tag centred at (cx, cy) between from and to, fading in over .25 s */
    const show = (tag: Piece, cx: number, cy: number, from: number, to: number) => {
      const alpha = range(seconds, from, from + .25) * (to === Infinity ? 1 : 1 - range(seconds, to - .15, to));
      tag.mesh.visible = alpha > 0;
      if (alpha <= 0) return;
      const w = (tag.w + 2 * MARGIN) * kT, h = (tag.h + 2 * MARGIN) * kT;
      tag.mesh.scale.set(w, h, 1);
      tag.mesh.rotation.x = lean;
      tag.mesh.position.set(cx, cy - (1 - alpha) * .02, .07 + .5 * h * Math.sin(lean) + (1 - alpha) * .02);
      tag.material.opacity = alpha;
    };
    /** a tag sitting beside a pin: its centre line is level with the pin */
    const beside = (tag: Piece, pin: { x: number; y: number }, side: number, from: number, to: number, dy = 0) =>
      show(tag, pin.x + side * (rPin + .03 * lay.off + tag.w * kT / 2), pin.y + dy * lay.off, from, to);
    const near = (ax: number, ay: number, ox: number, oy: number) => [ax + ox * lay.off, wy(ay) + oy * lay.off] as const;

    const gap = .04 * lay.off;
    const sides = [1, 1, -1, 0, -1, -1, 0];
    /** tag centred above a pin (side 0) */
    const above = (tag: Piece, pin: { x: number; y: number }, from: number, to: number, lift = 0, shift = 0, leftAlign = false) =>
      show(tag, pin.x + shift + (leftAlign && !narrow ? tag.w * kT / 2 - rPin : 0), pin.y + rPin + gap + lift + tag.h * kT / 2, from, to);
    const gainFrom = DELIVERED + .4;
    eventTags.forEach((tag, i) => {
      const until = i === journeySteps.length - 1 ? (narrow ? gainFrom : Infinity) : eventEnd(i);
      const from = journeySteps[i].at + .1;
      if (sides[i] === 0) above(tag, pins[i], from, until, 0, 0, i === 6);
      else beside(tag, pins[i], sides[i], from, until);
    });
    // 03: what each side loses (the restaurant's tag sits where its pin is; the rider's under the rider; the customer's under their house)
    const lossFrom = CANCELLED + .6;
    const lossTo = narrow ? OFFERS : ACCEPTED; // on a phone the losses clear away when the offer goes out
    above(lossTags[0], pins[0], lossFrom, lossTo);
    let [cx, cy] = near(radarOrigin.x, radarOrigin.y, -.18, -.21);
    show(lossTags[1], cx, cy, lossFrom, lossTo);
    // (the customer's, under the house that cancelled)
    [cx, cy] = near(originalHome.x, originalHome.y, .02, -.6);
    show(lossTags[2], cx, cy, lossFrom, lossTo);
    // 04: who gets the offer, who does not
    [cx, cy] = near(far.point.x, far.point.y, -.1, .46);
    if (narrow) offeredTag.mesh.visible = false; // on a phone the little bag on the far house is enough
    else show(offeredTag, cx, cy, arrivalFar + .1, ACCEPTED);
    // the skipped house: its tag sits just under the no-offer ring
    if (narrow) { // no room above the roof on a phone: just below the house
      [cx, cy] = near(door.point.x, door.point.y, .05, -.5);
      show(skippedTag, cx, cy, arrivalDoor + .1, ACCEPTED);
    } else show(skippedTag, zone.x + .2, wy(zone.y) - zone.r - .16, arrivalDoor + .1, ACCEPTED); // one line, just under the ring, clear of its dashes
    // 05: the price
    above(priceTag, pins[6], ACCEPTED + .35, REROUTED, .12 * lay.off, 0, true);
    // 07: what each side gains: the buyer's above "Delivered", the restaurant's where its pin is, the rider's above the rider's pin
    above(gainTags[0], pins[6], gainFrom, Infinity, eventTags[6].h * kT + gap, 0, true);
    above(gainTags[1], pins[0], gainFrom, Infinity);
    beside(gainTags[2], pins[5], -1, gainFrom, Infinity);

    const current = journeyAt(seconds);
    if (step !== current) {
      step = current;
      narration.textContent = reduced
        ? journeySteps.map(({ n, title, line, why }) => `${n}. ${title}. ${line}${why ? ' ' + why : ''}`).join(' ')
        : `${journeySteps[step].n}. ${journeySteps[step].title}. ${journeySteps[step].line}${journeySteps[step].why ? ' ' + journeySteps[step].why : ''}`;
    }
  };

  return {
    open() {
      loadRider();
      root.visible = true;
      step = -1;
      time = reduced ? JOURNEY_END : 0;
      pose(time);
      invalidate();
    },
    /** seconds into the journey (0 .. JOURNEY_END) */
    get time() { return time; },
    get showing() { return root.visible; },
    /** Jump to a moment and carry on playing from there (a click on a board row, the arrow keys, the capture script). */
    seek(seconds: number) {
      time = Math.min(JOURNEY_END, Math.max(0, seconds));
      step = -1;
      pose(time);
      invalidate();
    },
    close() {
      root.visible = false;
      narration.textContent = '';
    },
    update(dt: number, narrow: boolean) {
      if (!root.visible) return false;
      time = Math.min(JOURNEY_END, time + dt * JOURNEY_RATE);
      pose(time, narrow);
      return time < JOURNEY_END;
    },
    dispose() {
      disposed = true;
      root.removeFromParent();
      narration.remove();
      disposables.splice(0).forEach(resource => resource.dispose());
    },
  };
}
