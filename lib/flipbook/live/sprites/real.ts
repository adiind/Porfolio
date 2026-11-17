/**
 * Measured boxes of the Real page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const REAL_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2163,
    "h": 683,
    "sprites": [
      {
        "name": "R0",
        "rect": [
          6,
          6,
          549,
          669
        ],
        "source": [
          16,
          34,
          543,
          663
        ],
        "holes": [
          [
            235,
            215,
            114,
            108
          ]
        ]
      },
      {
        "name": "E1",
        "rect": [
          561,
          6,
          487,
          662
        ],
        "source": [
          576,
          38,
          481,
          656
        ],
        "holes": []
      },
      {
        "name": "A2",
        "rect": [
          1054,
          6,
          608,
          671
        ],
        "source": [
          1057,
          32,
          602,
          665
        ],
        "holes": [
          [
            1310,
            283,
            108,
            129
          ]
        ]
      },
      {
        "name": "L3",
        "rect": [
          1668,
          6,
          489,
          668
        ],
        "source": [
          1674,
          32,
          483,
          662
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 605,
    "h": 456,
    "scale": 0.5,
    "sprites": [
      {
        "name": "sew-up",
        "rect": [
          6,
          6,
          170,
          444
        ],
        "source": [
          144,
          53,
          333,
          882
        ],
        "holes": [
          [
            278,
            273,
            84,
            128
          ],
          [
            392,
            71,
            9,
            23
          ]
        ]
      },
      {
        "name": "sew-pull",
        "rect": [
          182,
          6,
          257,
          369
        ],
        "source": [
          482,
          200,
          508,
          732
        ],
        "holes": [
          [
            605,
            438,
            84,
            82
          ],
          [
            871,
            641,
            43,
            19
          ]
        ]
      },
      {
        "name": "proud",
        "rect": [
          445,
          6,
          154,
          400
        ],
        "source": [
          1111,
          138,
          302,
          795
        ],
        "holes": [
          [
            1332,
            419,
            36,
            82
          ]
        ]
      }
    ]
  }
} as const;
