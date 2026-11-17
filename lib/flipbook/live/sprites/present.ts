/**
 * Measured boxes of the Present page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const PRESENT_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2100,
    "h": 519,
    "sprites": [
      {
        "name": "P0",
        "rect": [
          6,
          6,
          303,
          506
        ],
        "source": [
          27,
          100,
          297,
          500
        ],
        "holes": [
          [
            133,
            203,
            85,
            110
          ]
        ]
      },
      {
        "name": "R1",
        "rect": [
          315,
          6,
          301,
          505
        ],
        "source": [
          345,
          100,
          295,
          499
        ],
        "holes": [
          [
            451,
            203,
            85,
            110
          ]
        ]
      },
      {
        "name": "E2",
        "rect": [
          622,
          6,
          273,
          500
        ],
        "source": [
          663,
          100,
          267,
          494
        ],
        "holes": []
      },
      {
        "name": "S3",
        "rect": [
          901,
          6,
          303,
          507
        ],
        "source": [
          941,
          98,
          297,
          501
        ],
        "holes": []
      },
      {
        "name": "E4",
        "rect": [
          1210,
          6,
          273,
          500
        ],
        "source": [
          1261,
          100,
          267,
          494
        ],
        "holes": []
      },
      {
        "name": "N5",
        "rect": [
          1489,
          6,
          312,
          504
        ],
        "source": [
          1546,
          100,
          306,
          498
        ],
        "holes": []
      },
      {
        "name": "T6",
        "rect": [
          1807,
          6,
          287,
          504
        ],
        "source": [
          1867,
          100,
          281,
          498
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 693,
    "h": 348,
    "scale": 0.5,
    "sprites": [
      {
        "name": "stride-a",
        "rect": [
          6,
          6,
          178,
          308
        ],
        "source": [
          98,
          70,
          349,
          611
        ],
        "holes": []
      },
      {
        "name": "pass",
        "rect": [
          190,
          6,
          98,
          314
        ],
        "source": [
          586,
          58,
          190,
          621
        ],
        "holes": []
      },
      {
        "name": "stride-b",
        "rect": [
          294,
          6,
          186,
          308
        ],
        "source": [
          901,
          69,
          366,
          611
        ],
        "holes": []
      },
      {
        "name": "look",
        "rect": [
          486,
          6,
          71,
          322
        ],
        "source": [
          1428,
          43,
          136,
          639
        ],
        "holes": []
      },
      {
        "name": "wave",
        "rect": [
          563,
          6,
          124,
          336
        ],
        "source": [
          1790,
          17,
          243,
          666
        ],
        "holes": []
      }
    ]
  }
} as const;
