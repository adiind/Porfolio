/**
 * Measured boxes and anchor points of the Awake page's sprite sheets.
 * Written by scripts/flipbook/make-awake-sprites.py. Do not edit by hand.
 */
export const AWAKE_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "mandala": {
    "w": 805,
    "h": 790,
    "source": [
      267,
      0,
      1000,
      984
    ],
    "scale": 0.8
  },
  "hill": {
    "w": 1536,
    "h": 343,
    "ridge": 156,
    "sourceTop": 681
  },
  "letters": {
    "w": 2222,
    "h": 632,
    "sprites": [
      {
        "name": "A1",
        "rect": [
          6,
          6,
          442,
          620
        ],
        "source": [
          15,
          48,
          436,
          614
        ]
      },
      {
        "name": "W",
        "rect": [
          454,
          6,
          535,
          613
        ],
        "source": [
          420,
          56,
          529,
          607
        ]
      },
      {
        "name": "A2",
        "rect": [
          995,
          6,
          443,
          620
        ],
        "source": [
          901,
          48,
          437,
          614
        ]
      },
      {
        "name": "K",
        "rect": [
          1444,
          6,
          400,
          614
        ],
        "source": [
          1350,
          56,
          394,
          608
        ]
      },
      {
        "name": "E",
        "rect": [
          1850,
          6,
          366,
          620
        ],
        "source": [
          1779,
          51,
          360,
          614
        ]
      }
    ]
  },
  "people": {
    "w": 853,
    "h": 1218,
    "sprites": [
      {
        "name": "p1-asleep",
        "ropes": [
          [
            3.5,
            1.5
          ],
          [
            231.2,
            1.5
          ]
        ],
        "rect": [
          6,
          6,
          235,
          174
        ]
      },
      {
        "name": "p1-waking",
        "ropes": [
          [
            3.5,
            47.0
          ],
          [
            226.8,
            47.0
          ]
        ],
        "rect": [
          247,
          6,
          230,
          220
        ]
      },
      {
        "name": "p1-awake",
        "ropes": [
          [
            3.2,
            44.5
          ],
          [
            230.2,
            44.5
          ]
        ],
        "rect": [
          483,
          6,
          234,
          239
        ]
      },
      {
        "name": "p2-asleep",
        "ropes": [
          [
            15.2,
            1.5
          ],
          [
            111.8,
            1.5
          ]
        ],
        "rect": [
          723,
          6,
          124,
          451
        ]
      },
      {
        "name": "p2-waking",
        "ropes": [
          [
            36.0,
            1.5
          ],
          [
            138.5,
            1.5
          ]
        ],
        "rect": [
          6,
          463,
          151,
          451
        ]
      },
      {
        "name": "p2-awake",
        "ropes": [
          [
            18.2,
            1.5
          ],
          [
            131.5,
            1.5
          ]
        ],
        "rect": [
          163,
          463,
          170,
          416
        ]
      },
      {
        "name": "p3-asleep",
        "rect": [
          339,
          463,
          262,
          200
        ]
      },
      {
        "name": "p3-waking",
        "rect": [
          607,
          463,
          228,
          268
        ]
      },
      {
        "name": "p3-awake",
        "rect": [
          6,
          920,
          192,
          292
        ]
      }
    ]
  }
} as const;
