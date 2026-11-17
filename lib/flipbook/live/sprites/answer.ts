/**
 * Measured boxes of the Answer page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const ANSWER_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2199,
    "h": 636,
    "sprites": [
      {
        "name": "A0",
        "rect": [
          6,
          6,
          371,
          615
        ],
        "source": [
          7,
          68,
          365,
          609
        ],
        "holes": [
          [
            166,
            284,
            48,
            125
          ]
        ]
      },
      {
        "name": "N1",
        "rect": [
          383,
          6,
          330,
          614
        ],
        "source": [
          378,
          69,
          324,
          608
        ],
        "holes": []
      },
      {
        "name": "S2",
        "rect": [
          719,
          6,
          326,
          624
        ],
        "source": [
          712,
          64,
          320,
          618
        ],
        "holes": []
      },
      {
        "name": "W3",
        "rect": [
          1051,
          6,
          496,
          614
        ],
        "source": [
          1027,
          69,
          490,
          608
        ],
        "holes": []
      },
      {
        "name": "E4",
        "rect": [
          1553,
          6,
          297,
          612
        ],
        "source": [
          1529,
          70,
          291,
          606
        ],
        "holes": []
      },
      {
        "name": "R5",
        "rect": [
          1856,
          6,
          337,
          614
        ],
        "source": [
          1833,
          70,
          331,
          608
        ],
        "holes": [
          [
            1964,
            216,
            58,
            98
          ]
        ]
      }
    ]
  },
  "people": {
    "w": 590,
    "h": 450,
    "scale": 0.5,
    "sprites": [
      {
        "name": "ask",
        "rect": [
          6,
          6,
          104,
          426
        ],
        "source": [
          125,
          103,
          202,
          845
        ],
        "holes": []
      },
      {
        "name": "wait",
        "rect": [
          116,
          6,
          108,
          424
        ],
        "source": [
          442,
          105,
          210,
          843
        ],
        "holes": [
          [
            489,
            381,
            44,
            78
          ]
        ]
      },
      {
        "name": "cheer",
        "rect": [
          230,
          6,
          216,
          438
        ],
        "source": [
          719,
          78,
          425,
          870
        ],
        "holes": []
      },
      {
        "name": "thumb",
        "rect": [
          452,
          6,
          132,
          425
        ],
        "source": [
          1211,
          104,
          258,
          844
        ],
        "holes": [
          [
            1259,
            399,
            30,
            147
          ],
          [
            1398,
            292,
            25,
            28
          ]
        ]
      }
    ]
  }
} as const;
