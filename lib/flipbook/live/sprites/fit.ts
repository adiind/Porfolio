/**
 * Measured boxes of the Fit page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const FIT_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 1434,
    "h": 728,
    "sprites": [
      {
        "name": "F0",
        "rect": [
          6,
          6,
          586,
          714
        ],
        "source": [
          187,
          10,
          580,
          708
        ],
        "holes": []
      },
      {
        "name": "I1",
        "rect": [
          598,
          6,
          254,
          530
        ],
        "source": [
          960,
          194,
          248,
          524
        ],
        "holes": []
      },
      {
        "name": "T2",
        "rect": [
          858,
          6,
          570,
          716
        ],
        "source": [
          1411,
          11,
          564,
          712
        ],
        "holes": []
      }
    ]
  },
  "parts": {
    "w": 1116,
    "h": 453,
    "scale": 0.8,
    "sprites": [
      {
        "name": "board",
        "rect": [
          6,
          6,
          195,
          332
        ],
        "source": [
          69,
          334,
          238,
          409
        ],
        "holes": []
      },
      {
        "name": "caliper",
        "rect": [
          207,
          6,
          903,
          441
        ],
        "source": [
          376,
          255,
          1123,
          545
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 709,
    "h": 325,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-push",
        "rect": [
          6,
          6,
          210,
          285
        ],
        "source": [
          13,
          257,
          414,
          564
        ],
        "holes": []
      },
      {
        "name": "maker-cheer",
        "rect": [
          222,
          6,
          138,
          313
        ],
        "source": [
          477,
          207,
          269,
          620
        ],
        "holes": []
      },
      {
        "name": "girl-push",
        "rect": [
          366,
          6,
          217,
          274
        ],
        "source": [
          785,
          280,
          428,
          543
        ],
        "holes": [
          [
            899,
            523,
            30,
            13
          ]
        ]
      },
      {
        "name": "girl-clap",
        "rect": [
          589,
          6,
          114,
          300
        ],
        "source": [
          1281,
          233,
          221,
          594
        ],
        "holes": [
          [
            1420,
            505,
            27,
            18
          ]
        ]
      }
    ]
  }
} as const;
