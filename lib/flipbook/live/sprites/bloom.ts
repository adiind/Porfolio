/**
 * Measured boxes of the Bloom page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const BLOOM_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2193,
    "h": 585,
    "sprites": [
      {
        "name": "B0",
        "rect": [
          6,
          6,
          387,
          561
        ],
        "source": [
          14,
          86,
          381,
          555
        ],
        "holes": [
          [
            152,
            420,
            96,
            86
          ],
          [
            152,
            198,
            90,
            78
          ]
        ]
      },
      {
        "name": "L1",
        "rect": [
          399,
          6,
          310,
          567
        ],
        "source": [
          407,
          81,
          304,
          561
        ],
        "holes": []
      },
      {
        "name": "O2",
        "rect": [
          715,
          6,
          480,
          573
        ],
        "source": [
          690,
          80,
          474,
          567
        ],
        "holes": [
          [
            813,
            236,
            225,
            257
          ]
        ]
      },
      {
        "name": "O3",
        "rect": [
          1201,
          6,
          480,
          573
        ],
        "source": [
          1176,
          80,
          474,
          567
        ],
        "holes": [
          [
            1299,
            236,
            224,
            257
          ]
        ]
      },
      {
        "name": "M4",
        "rect": [
          1687,
          6,
          500,
          571
        ],
        "source": [
          1663,
          80,
          494,
          565
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 673,
    "h": 411,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-watch",
        "rect": [
          6,
          6,
          130,
          386
        ],
        "source": [
          40,
          148,
          253,
          767
        ],
        "holes": [
          [
            90,
            436,
            49,
            60
          ],
          [
            240,
            439,
            15,
            41
          ]
        ]
      },
      {
        "name": "maker-cheer",
        "rect": [
          142,
          6,
          170,
          399
        ],
        "source": [
          373,
          120,
          334,
          792
        ],
        "holes": []
      },
      {
        "name": "girl-hold",
        "rect": [
          318,
          6,
          148,
          351
        ],
        "source": [
          775,
          216,
          290,
          696
        ],
        "holes": []
      },
      {
        "name": "girl-jump",
        "rect": [
          472,
          6,
          195,
          344
        ],
        "source": [
          1113,
          151,
          384,
          681
        ],
        "holes": [
          [
            1332,
            247,
            52,
            89
          ],
          [
            1264,
            322,
            35,
            17
          ]
        ]
      }
    ]
  }
} as const;
