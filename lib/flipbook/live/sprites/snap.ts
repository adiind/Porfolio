/**
 * Measured boxes of the Snap page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const SNAP_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2097,
    "h": 703,
    "sprites": [
      {
        "name": "S0",
        "rect": [
          6,
          6,
          514,
          691
        ],
        "source": [
          17,
          22,
          508,
          685
        ],
        "holes": []
      },
      {
        "name": "N1",
        "rect": [
          526,
          6,
          513,
          684
        ],
        "source": [
          571,
          24,
          507,
          678
        ],
        "holes": []
      },
      {
        "name": "A2",
        "rect": [
          1045,
          6,
          571,
          684
        ],
        "source": [
          1096,
          24,
          565,
          678
        ],
        "holes": [
          [
            1327,
            266,
            104,
            146
          ]
        ]
      },
      {
        "name": "P3",
        "rect": [
          1622,
          6,
          469,
          684
        ],
        "source": [
          1692,
          23,
          463,
          678
        ],
        "holes": [
          [
            1878,
            195,
            92,
            114
          ]
        ]
      }
    ]
  },
  "people": {
    "w": 683,
    "h": 396,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-press",
        "rect": [
          6,
          6,
          226,
          345
        ],
        "source": [
          20,
          198,
          447,
          684
        ],
        "holes": []
      },
      {
        "name": "maker-cheer",
        "rect": [
          238,
          6,
          156,
          384
        ],
        "source": [
          487,
          119,
          306,
          761
        ],
        "holes": []
      },
      {
        "name": "girl-peg",
        "rect": [
          400,
          6,
          139,
          316
        ],
        "source": [
          846,
          259,
          272,
          625
        ],
        "holes": [
          [
            971,
            811,
            27,
            44
          ]
        ]
      },
      {
        "name": "girl-clap",
        "rect": [
          545,
          6,
          132,
          316
        ],
        "source": [
          1224,
          259,
          258,
          625
        ],
        "holes": [
          [
            1330,
            811,
            29,
            45
          ]
        ]
      }
    ]
  }
} as const;
