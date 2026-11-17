/**
 * Measured boxes of the Here page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const HERE_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2004,
    "h": 692,
    "sprites": [
      {
        "name": "H0",
        "rect": [
          6,
          6,
          552,
          680
        ],
        "source": [
          33,
          25,
          546,
          674
        ],
        "holes": []
      },
      {
        "name": "E1",
        "rect": [
          564,
          6,
          438,
          680
        ],
        "source": [
          644,
          25,
          432,
          674
        ],
        "holes": []
      },
      {
        "name": "R2",
        "rect": [
          1008,
          6,
          525,
          680
        ],
        "source": [
          1127,
          25,
          519,
          674
        ],
        "holes": [
          [
            1307,
            176,
            148,
            134
          ]
        ]
      },
      {
        "name": "E3",
        "rect": [
          1539,
          6,
          459,
          680
        ],
        "source": [
          1687,
          25,
          453,
          674
        ],
        "holes": []
      }
    ]
  },
  "parts": {
    "w": 1226,
    "h": 238,
    "scale": 0.8,
    "sprites": [
      {
        "name": "roof",
        "rect": [
          6,
          6,
          1214,
          226
        ],
        "source": [
          12,
          374,
          1512,
          277
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 643,
    "h": 485,
    "scale": 0.5,
    "sprites": [
      {
        "name": "speak",
        "rect": [
          6,
          6,
          123,
          473
        ],
        "source": [
          72,
          45,
          240,
          940
        ],
        "holes": [
          [
            201,
            198,
            68,
            84
          ],
          [
            136,
            889,
            17,
            35
          ]
        ]
      },
      {
        "name": "watch",
        "rect": [
          135,
          6,
          136,
          471
        ],
        "source": [
          389,
          49,
          266,
          936
        ],
        "holes": [
          [
            444,
            340,
            47,
            87
          ]
        ]
      },
      {
        "name": "shrug",
        "rect": [
          277,
          6,
          230,
          471
        ],
        "source": [
          700,
          44,
          453,
          936
        ],
        "holes": []
      },
      {
        "name": "content",
        "rect": [
          513,
          6,
          124,
          472
        ],
        "source": [
          1228,
          44,
          241,
          937
        ],
        "holes": []
      }
    ]
  }
} as const;
