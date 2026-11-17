/**
 * Measured boxes of the Button page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const BUTTON_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2216,
    "h": 563,
    "sprites": [
      {
        "name": "B0",
        "rect": [
          6,
          6,
          341,
          551
        ],
        "source": [
          12,
          94,
          335,
          545
        ],
        "holes": [
          [
            137,
            421,
            79,
            83
          ],
          [
            138,
            214,
            72,
            79
          ]
        ]
      },
      {
        "name": "U1",
        "rect": [
          353,
          6,
          340,
          542
        ],
        "source": [
          347,
          101,
          334,
          536
        ],
        "holes": []
      },
      {
        "name": "T2",
        "rect": [
          699,
          6,
          316,
          546
        ],
        "source": [
          681,
          96,
          310,
          540
        ],
        "holes": []
      },
      {
        "name": "T3",
        "rect": [
          1021,
          6,
          315,
          546
        ],
        "source": [
          1000,
          96,
          309,
          540
        ],
        "holes": []
      },
      {
        "name": "O4",
        "rect": [
          1342,
          6,
          495,
          541
        ],
        "source": [
          1301,
          99,
          489,
          535
        ],
        "holes": [
          [
            1384,
            200,
            321,
            332
          ]
        ]
      },
      {
        "name": "N5",
        "rect": [
          1843,
          6,
          367,
          543
        ],
        "source": [
          1799,
          99,
          361,
          537
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 743,
    "h": 273,
    "scale": 0.5,
    "sprites": [
      {
        "name": "muse-back",
        "rect": [
          6,
          6,
          112,
          155
        ],
        "source": [
          44,
          468,
          217,
          304
        ],
        "holes": []
      },
      {
        "name": "muse-sleep",
        "rect": [
          124,
          6,
          108,
          155
        ],
        "source": [
          301,
          468,
          210,
          304
        ],
        "holes": []
      },
      {
        "name": "muse-talk",
        "rect": [
          238,
          6,
          122,
          158
        ],
        "source": [
          545,
          463,
          237,
          309
        ],
        "holes": []
      },
      {
        "name": "maker-reach",
        "rect": [
          366,
          6,
          179,
          261
        ],
        "source": [
          781,
          264,
          352,
          516
        ],
        "holes": [
          [
            1014,
            709,
            16,
            26
          ]
        ]
      },
      {
        "name": "maker-press",
        "rect": [
          551,
          6,
          186,
          260
        ],
        "source": [
          1145,
          267,
          366,
          513
        ],
        "holes": [
          [
            1402,
            710,
            15,
            23
          ]
        ]
      }
    ]
  }
} as const;
