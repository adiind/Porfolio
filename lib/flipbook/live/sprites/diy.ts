/**
 * Measured boxes of the Diy page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const DIY_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 1686,
    "h": 696,
    "sprites": [
      {
        "name": "D0",
        "rect": [
          6,
          6,
          641,
          684
        ],
        "source": [
          185,
          23,
          635,
          678
        ],
        "holes": [
          [
            375,
            160,
            239,
            403
          ]
        ]
      },
      {
        "name": "I1",
        "rect": [
          653,
          6,
          363,
          684
        ],
        "source": [
          910,
          23,
          357,
          678
        ],
        "holes": []
      },
      {
        "name": "Y2",
        "rect": [
          1022,
          6,
          658,
          683
        ],
        "source": [
          1345,
          23,
          652,
          677
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 1003,
    "h": 340,
    "scale": 0.5,
    "sprites": [
      {
        "name": "man-work",
        "rect": [
          6,
          6,
          180,
          237
        ],
        "source": [
          38,
          195,
          354,
          468
        ],
        "holes": [
          [
            207,
            430,
            61,
            36
          ]
        ]
      },
      {
        "name": "man-cheer",
        "rect": [
          192,
          6,
          182,
          328
        ],
        "source": [
          396,
          26,
          358,
          651
        ],
        "holes": []
      },
      {
        "name": "woman-work",
        "rect": [
          380,
          6,
          145,
          280
        ],
        "source": [
          784,
          123,
          284,
          553
        ],
        "holes": [
          [
            866,
            613,
            25,
            38
          ]
        ]
      },
      {
        "name": "woman-cheer",
        "rect": [
          531,
          6,
          148,
          310
        ],
        "source": [
          1120,
          62,
          289,
          614
        ],
        "holes": []
      },
      {
        "name": "elder-work",
        "rect": [
          685,
          6,
          135,
          296
        ],
        "source": [
          1460,
          91,
          264,
          586
        ],
        "holes": []
      },
      {
        "name": "elder-cheer",
        "rect": [
          826,
          6,
          171,
          324
        ],
        "source": [
          1800,
          36,
          336,
          642
        ],
        "holes": []
      }
    ]
  }
} as const;
