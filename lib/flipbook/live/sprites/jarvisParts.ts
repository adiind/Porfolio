/**
 * Jarvis's sensor head as measured lines, and the size of every picture of it, for the flip book.
 * Written by scripts/flipbook/make-jarvis-parts.py. Do not edit by hand.
 *
 * Units: plate width 100, origin its top left, y down. All but `pictures` is measured on sensor.webp:
 * his front photo of the sensor head on his mat (page 12 of his older deck), straightened by a homography
 * from the plate's corners. `photo.plate` is where the plate sits in sensor.webp, in pixels.
 * - plate: the textured printed face. A darker step round it (about 3 units left, 2 right, 3.5 below,
 *   none on top; side wall or chamfer, not resolved) is left out, and cut away in sensor-cut.webp.
 *   Corners: 3, 0, 0, 12 px of rounding (tl tr br bl); three read sharp, so 0.
 *   h: four corners cannot fix a rectangle's shape, so h comes from the sides' lengths, which is right
 *   if the face is square on to the camera (its sides agree within about 2%). The seat reads 1.014 as
 *   tall as wide, so if the seat is truly square h is up to 1.4% too large.
 * - domeSeat: the square the dome sits in. dome: a circle on its outline near the seat's diagonals.
 * - leds: the lenses (tl tr bl br), each the circle most of its edge points agree on. screws: none show.
 * - facets: 14 centres, the points farthest from any facet edge, kept where other smoothings agree.
 *   Not all: a glint hides two of the inner ring and the rim's are edge-on; none filled in by symmetry.
 *   facetR: half the typical spacing between neighbours.
 * - mm: null. The face is turned to the camera, not in the mat's plane: the mat's squares beside it look
 *   0.79 as tall as wide, the seat 1.01. And the grid there mixes arcs, diagonals and
 *   rulers, so it does not read cleanly. The mat is no ruler for the plate.
 * - pictures: every picture in public/images/flipbook/jarvis/parts/, as written (pixels). prints.webp loses
 *   its top 48 rows, where house keys lay.
 * - case: the whole case, from his photo of it lying on the mat (hero-image.jpg in his repo). The mat's
 *   10 mm grid (10 mm by its rulers: 60 to 170 up its left edge, 220 to 320 along its bottom, a cell per
 *   10) gives a homography to mat millimetres, fitted to 929 ridge samples on its lines, rms 0.068 mm.
 *   casePhoto: case-top.webp, the mat seen from straight above at pxPerMm (the photo's own resolution
 *   at the case), turned so the case stands upright, head at the top; origin: the outline's top left.
 *   That view is true only on the mat. The lid, up in the air, looks 1.132 times too big, so
 *   outline, cornerR, head and flower are in mm as photographed (they lie on the picture); multiply
 *   lengths by lidScale for true mm. outline: the lid's top as it shows, its outer edge against the mat
 *   on the far sides (left, top) and the edge of its flat top where the walls show (right, bottom); those
 *   two sit about 2 mm inside the top of the wall (a rounded top edge), so outline x lidScale comes out
 *   about 2 mm under case.mm. case.mm is the true size: w and l the footprint on the mat (the
 *   walls' feet, and where the slanted corner edges meet the mat, for rounded corners); h from the
 *   lid's scale and the camera's height over the mat (293 mm; the camera solution lands 4 mm from the
 *   point the corner edges run to). head: the sensor plate's end of the lid, to the seam; seatW: the
 *   dome's white seat. flower: 8 petals as found (none assumed, none made regular): inner and
 *   outer end of each centre line, widest width, outline.
 */
export const JARVIS_PARTS = {
  plate: {"w": 100, "h": 56.6, "corner": 0},
  domeSeat: {"x": 29.1, "y": 9.6, "w": 41.0, "h": 41.5, "corner": 2.1},
  dome: {"x": 49.5, "y": 30.3, "r": 20.8},
  leds: [{"x": 11.2, "y": 18.7, "r": 3.9}, {"x": 87.4, "y": 18.1, "r": 4.0}, {"x": 10.8, "y": 44.1, "r": 4.0}, {"x": 87.2, "y": 43.4, "r": 4.0}],
  screws: [],
  facets: [[57.0, 23.5], [44.3, 33.9], [45.5, 42.2], [52.0, 45.1], [50.9, 29.5], [52.4, 38.2], [59.0, 32.9], [46.6, 13.5], [36.8, 30.4], [65.1, 36.2], [42.0, 18.3], [64.4, 27.0], [55.9, 17.0], [36.4, 24.1]],
  facetR: 3.5,
  photo: {"file": "sensor.webp", "width": 603, "height": 378, "plate": {"x": 42.0, "y": 42.0, "w": 519.0, "h": 294.0}},
  mm: null,
  pictures: [{"file": "sensor.webp", "width": 603, "height": 378}, {"file": "sensor-cut.webp", "width": 603, "height": 378}, {"file": "sensor-back.webp", "width": 699, "height": 427}, {"file": "case.webp", "width": 1600, "height": 1586}, {"file": "desk.webp", "width": 1600, "height": 822}, {"file": "wall.webp", "width": 750, "height": 500}, {"file": "prints.webp", "width": 750, "height": 952}, {"file": "sketch.webp", "width": 750, "height": 500}, {"file": "board.webp", "width": 1024, "height": 768}, {"file": "chip.webp", "width": 750, "height": 500}, {"file": "case-top.webp", "width": 1105, "height": 1418}],
  case: {"mm": {"w": 57.9, "l": 104.1, "h": 34.3, "error": {"w": 1.7, "l": 2.6, "h": 5.3}, "method": "mat grid homography; footprint from the walls' feet and the slanted corner edges; height from the lid's perspective scale and the camera height"}, "lidScale": 0.8831, "lidPhotographed": {"w": 63.49, "l": 115.26}, "outline": [[59.41, 0.0], [60.97, 0.31], [62.29, 1.19], [63.18, 2.52], [63.49, 4.08], [63.49, 111.18], [63.18, 112.74], [62.29, 114.07], [60.97, 114.95], [59.41, 115.26], [4.08, 115.26], [2.52, 114.95], [1.19, 114.07], [0.31, 112.74], [0.0, 111.18], [0.0, 4.08], [0.31, 2.52], [1.19, 1.19], [2.52, 0.31], [4.08, 0.0]], "cornerR": 4.08, "head": {"x": 0, "y": 0, "w": 63.49, "l": 34.04, "seatW": 24.67}, "flower": {"cx": 32.73, "cy": 77.61, "petals": [{"inner": [37.11, 81.0], "outer": [46.89, 90.56], "width": 3.67, "outline": [[36.91, 81.2], [39.74, 82.29], [43.66, 84.79], [46.24, 87.87], [47.24, 90.2], [45.91, 90.79], [42.82, 89.37]]}, {"inner": [32.88, 82.98], "outer": [33.85, 96.71], "width": 3.9, "outline": [[33.32, 82.95], [35.74, 90.37], [34.57, 96.2], [33.91, 96.7], [32.49, 95.87], [31.57, 91.04], [31.99, 86.29], [32.74, 83.2]]}, {"inner": [29.79, 80.99], "outer": [19.52, 91.06], "width": 4.23, "outline": [[29.74, 80.95], [30.16, 81.54], [29.82, 82.62], [25.66, 87.95], [23.57, 89.62], [19.91, 91.45], [19.74, 89.95], [23.07, 83.45]]}, {"inner": [26.95, 78.26], "outer": [13.5, 77.42], "width": 4.46, "outline": [[13.49, 77.87], [14.16, 75.12], [14.91, 74.7], [26.99, 77.45], [22.66, 80.04], [19.24, 80.12], [14.66, 79.29]]}, {"inner": [28.83, 73.62], "outer": [18.43, 63.92], "width": 4.02, "outline": [[18.41, 63.95], [19.57, 63.54], [24.32, 66.45], [28.91, 73.54], [23.41, 71.2], [20.24, 68.29], [18.32, 65.04]]}, {"inner": [32.36, 71.96], "outer": [32.16, 57.46], "width": 4.25, "outline": [[32.41, 57.45], [34.07, 58.2], [34.57, 62.87], [32.74, 71.95], [32.16, 71.45], [30.74, 67.12], [30.16, 63.37], [31.16, 58.37]]}, {"inner": [36.31, 73.19], "outer": [45.78, 62.85], "width": 3.56, "outline": [[47.07, 64.04], [39.57, 72.12], [37.49, 73.45], [36.24, 73.12], [37.49, 70.04], [40.32, 65.62], [44.74, 62.95], [45.49, 62.87]]}, {"inner": [38.24, 76.98], "outer": [52.15, 76.41], "width": 4.28, "outline": [[52.16, 76.7], [51.32, 77.62], [46.24, 79.04], [38.99, 77.62], [38.24, 77.04], [39.24, 76.04], [46.49, 74.54], [51.49, 75.87]]}]}, "grid": {"rmsMm": 0.068, "samples": 929}},
  casePhoto: {"file": "case-top.webp", "width": 1105, "height": 1418, "pxPerMm": 9.0, "origin": [239.3, 236.7]},
} as const;
