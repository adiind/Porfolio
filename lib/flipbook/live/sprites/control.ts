/**
 * Measured boxes of the Control page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const CONTROL_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2215,
    "h": 432,
    "sprites": [
      {
        "name": "C0",
        "rect": [
          6,
          6,
          308,
          420
        ],
        "source": [
          8,
          163,
          302,
          414
        ],
        "holes": []
      },
      {
        "name": "O1",
        "rect": [
          320,
          6,
          367,
          405
        ],
        "source": [
          307,
          171,
          361,
          399
        ],
        "holes": []
      },
      {
        "name": "N2",
        "rect": [
          693,
          6,
          310,
          408
        ],
        "source": [
          677,
          170,
          304,
          402
        ],
        "holes": []
      },
      {
        "name": "T3",
        "rect": [
          1009,
          6,
          266,
          409
        ],
        "source": [
          991,
          169,
          260,
          403
        ],
        "holes": []
      },
      {
        "name": "R4",
        "rect": [
          1281,
          6,
          290,
          409
        ],
        "source": [
          1261,
          169,
          284,
          403
        ],
        "holes": [
          [
            1370,
            263,
            59,
            69
          ]
        ]
      },
      {
        "name": "O5",
        "rect": [
          1577,
          6,
          372,
          405
        ],
        "source": [
          1539,
          171,
          366,
          399
        ],
        "holes": []
      },
      {
        "name": "L6",
        "rect": [
          1955,
          6,
          254,
          409
        ],
        "source": [
          1914,
          169,
          248,
          403
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 675,
    "h": 498,
    "scale": 0.5,
    "sprites": [
      {
        "name": "point",
        "rect": [
          6,
          6,
          203,
          454
        ],
        "source": [
          68,
          74,
          400,
          901
        ],
        "holes": []
      },
      {
        "name": "pleased",
        "rect": [
          215,
          6,
          137,
          463
        ],
        "source": [
          459,
          67,
          268,
          920
        ],
        "holes": []
      },
      {
        "name": "read",
        "rect": [
          358,
          6,
          150,
          449
        ],
        "source": [
          846,
          87,
          295,
          892
        ],
        "holes": []
      },
      {
        "name": "yawn",
        "rect": [
          514,
          6,
          155,
          486
        ],
        "source": [
          1190,
          16,
          304,
          967
        ],
        "holes": [
          [
            1354,
            221,
            25,
            35
          ]
        ]
      }
    ]
  }
} as const;
