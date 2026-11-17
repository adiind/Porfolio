/**
 * Measured boxes of the Glow page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const GLOW_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2194,
    "h": 684,
    "sprites": [
      {
        "name": "G0",
        "rect": [
          6,
          6,
          541,
          672
        ],
        "source": [
          11,
          38,
          535,
          666
        ],
        "holes": []
      },
      {
        "name": "L1",
        "rect": [
          553,
          6,
          394,
          659
        ],
        "source": [
          572,
          44,
          388,
          653
        ],
        "holes": []
      },
      {
        "name": "O2",
        "rect": [
          953,
          6,
          551,
          672
        ],
        "source": [
          953,
          38,
          545,
          666
        ],
        "holes": [
          [
            1138,
            230,
            173,
            282
          ]
        ]
      },
      {
        "name": "W3",
        "rect": [
          1510,
          6,
          678,
          659
        ],
        "source": [
          1489,
          44,
          672,
          653
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 647,
    "h": 336,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-a",
        "rect": [
          6,
          6,
          156,
          324
        ],
        "source": [
          41,
          192,
          305,
          641
        ],
        "holes": []
      },
      {
        "name": "maker-b",
        "rect": [
          168,
          6,
          158,
          324
        ],
        "source": [
          420,
          192,
          310,
          642
        ],
        "holes": []
      },
      {
        "name": "girl-a",
        "rect": [
          332,
          6,
          149,
          284
        ],
        "source": [
          813,
          271,
          292,
          563
        ],
        "holes": []
      },
      {
        "name": "girl-b",
        "rect": [
          487,
          6,
          154,
          284
        ],
        "source": [
          1190,
          271,
          301,
          563
        ],
        "holes": []
      }
    ]
  }
} as const;
