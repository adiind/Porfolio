/**
 * Measured boxes of the Layers page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const LAYERS_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2157,
    "h": 548,
    "sprites": [
      {
        "name": "L0",
        "rect": [
          6,
          6,
          314,
          520
        ],
        "source": [
          22,
          107,
          308,
          514
        ],
        "holes": []
      },
      {
        "name": "A1",
        "rect": [
          326,
          6,
          397,
          522
        ],
        "source": [
          351,
          105,
          391,
          516
        ],
        "holes": [
          [
            510,
            247,
            65,
            147
          ]
        ]
      },
      {
        "name": "Y2",
        "rect": [
          729,
          6,
          382,
          520
        ],
        "source": [
          697,
          107,
          376,
          514
        ],
        "holes": []
      },
      {
        "name": "E3",
        "rect": [
          1117,
          6,
          336,
          521
        ],
        "source": [
          1091,
          107,
          330,
          515
        ],
        "holes": []
      },
      {
        "name": "R4",
        "rect": [
          1459,
          6,
          362,
          522
        ],
        "source": [
          1454,
          107,
          356,
          516
        ],
        "holes": [
          [
            1593,
            210,
            81,
            134
          ]
        ]
      },
      {
        "name": "S5",
        "rect": [
          1827,
          6,
          324,
          536
        ],
        "source": [
          1837,
          102,
          318,
          530
        ],
        "holes": []
      }
    ]
  },
  "parts": {
    "w": 1209,
    "h": 744,
    "scale": 0.8,
    "sprites": [
      {
        "name": "back",
        "rect": [
          6,
          6,
          681,
          732
        ],
        "source": [
          10,
          58,
          845,
          909
        ],
        "holes": [
          [
            147,
            443,
            575,
            144
          ],
          [
            301,
            623,
            93,
            91
          ],
          [
            478,
            623,
            93,
            91
          ],
          [
            391,
            316,
            91,
            90
          ]
        ]
      },
      {
        "name": "front",
        "rect": [
          693,
          6,
          510,
          556
        ],
        "source": [
          884,
          164,
          631,
          689
        ],
        "holes": [
          [
            986,
            457,
            427,
            111
          ],
          [
            1093,
            588,
            76,
            75
          ],
          [
            1231,
            588,
            75,
            75
          ],
          [
            1162,
            357,
            76,
            74
          ]
        ]
      }
    ]
  },
  "people": {
    "w": 644,
    "h": 491,
    "scale": 0.5,
    "sprites": [
      {
        "name": "reach",
        "rect": [
          6,
          6,
          216,
          479
        ],
        "source": [
          46,
          25,
          427,
          952
        ],
        "holes": []
      },
      {
        "name": "pull",
        "rect": [
          228,
          6,
          208,
          405
        ],
        "source": [
          542,
          180,
          410,
          804
        ],
        "holes": [
          [
            696,
            398,
            25,
            43
          ]
        ]
      },
      {
        "name": "rest",
        "rect": [
          442,
          6,
          196,
          463
        ],
        "source": [
          1080,
          64,
          387,
          920
        ],
        "holes": [
          [
            1338,
            370,
            57,
            98
          ],
          [
            1156,
            165,
            86,
            86
          ]
        ]
      }
    ]
  }
} as const;
