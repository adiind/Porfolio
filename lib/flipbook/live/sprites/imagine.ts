/**
 * Measured boxes of the Imagine page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const IMAGINE_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 1881,
    "h": 434,
    "sprites": [
      {
        "name": "I0",
        "rect": [
          6,
          6,
          142,
          409
        ],
        "source": [
          90,
          165,
          136,
          403
        ],
        "holes": []
      },
      {
        "name": "M1",
        "rect": [
          154,
          6,
          362,
          407
        ],
        "source": [
          270,
          167,
          356,
          401
        ],
        "holes": []
      },
      {
        "name": "A2",
        "rect": [
          522,
          6,
          317,
          408
        ],
        "source": [
          653,
          165,
          311,
          402
        ],
        "holes": [
          [
            774,
            281,
            70,
            118
          ]
        ]
      },
      {
        "name": "G3",
        "rect": [
          845,
          6,
          332,
          422
        ],
        "source": [
          971,
          157,
          326,
          416
        ],
        "holes": []
      },
      {
        "name": "I4",
        "rect": [
          1183,
          6,
          127,
          408
        ],
        "source": [
          1339,
          166,
          121,
          402
        ],
        "holes": []
      },
      {
        "name": "N5",
        "rect": [
          1316,
          6,
          304,
          406
        ],
        "source": [
          1511,
          167,
          298,
          400
        ],
        "holes": []
      },
      {
        "name": "E6",
        "rect": [
          1626,
          6,
          249,
          410
        ],
        "source": [
          1851,
          164,
          243,
          404
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 698,
    "h": 276,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-draw",
        "rect": [
          6,
          6,
          182,
          255
        ],
        "source": [
          22,
          266,
          358,
          504
        ],
        "holes": []
      },
      {
        "name": "maker-show",
        "rect": [
          194,
          6,
          204,
          264
        ],
        "source": [
          424,
          245,
          401,
          522
        ],
        "holes": []
      },
      {
        "name": "muse-look",
        "rect": [
          404,
          6,
          130,
          169
        ],
        "source": [
          873,
          422,
          255,
          332
        ],
        "holes": []
      },
      {
        "name": "muse-joy",
        "rect": [
          540,
          6,
          152,
          169
        ],
        "source": [
          1203,
          422,
          298,
          332
        ],
        "holes": []
      }
    ]
  }
} as const;
