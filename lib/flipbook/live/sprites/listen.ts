/**
 * Measured boxes of the Listen page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const LISTEN_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2188,
    "h": 699,
    "sprites": [
      {
        "name": "L0",
        "rect": [
          6,
          6,
          365,
          677
        ],
        "source": [
          12,
          26,
          359,
          671
        ],
        "holes": []
      },
      {
        "name": "I1",
        "rect": [
          377,
          6,
          198,
          678
        ],
        "source": [
          385,
          25,
          192,
          672
        ],
        "holes": []
      },
      {
        "name": "S2",
        "rect": [
          581,
          6,
          415,
          687
        ],
        "source": [
          590,
          25,
          409,
          681
        ],
        "holes": []
      },
      {
        "name": "T3",
        "rect": [
          1002,
          6,
          387,
          677
        ],
        "source": [
          990,
          33,
          381,
          671
        ],
        "holes": []
      },
      {
        "name": "E4",
        "rect": [
          1395,
          6,
          369,
          673
        ],
        "source": [
          1375,
          30,
          363,
          667
        ],
        "holes": []
      },
      {
        "name": "N5",
        "rect": [
          1770,
          6,
          412,
          683
        ],
        "source": [
          1751,
          27,
          406,
          677
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 574,
    "h": 363,
    "scale": 0.5,
    "sprites": [
      {
        "name": "idle",
        "rect": [
          6,
          6,
          70,
          351
        ],
        "source": [
          205,
          13,
          133,
          696
        ],
        "holes": []
      },
      {
        "name": "speak",
        "rect": [
          82,
          6,
          116,
          348
        ],
        "source": [
          568,
          20,
          226,
          689
        ],
        "holes": [
          [
            715,
            137,
            46,
            72
          ]
        ]
      },
      {
        "name": "shout",
        "rect": [
          204,
          6,
          146,
          337
        ],
        "source": [
          947,
          41,
          286,
          668
        ],
        "holes": [
          [
            1174,
            165,
            25,
            62
          ]
        ]
      },
      {
        "name": "hear",
        "rect": [
          356,
          6,
          102,
          342
        ],
        "source": [
          1411,
          30,
          197,
          679
        ],
        "holes": []
      },
      {
        "name": "glad",
        "rect": [
          464,
          6,
          104,
          351
        ],
        "source": [
          1811,
          13,
          203,
          696
        ],
        "holes": []
      }
    ]
  }
} as const;
