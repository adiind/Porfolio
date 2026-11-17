/**
 * Measured boxes of the Tangible page's sprite sheets.
 * Written by scripts/flipbook/make-live-sprites.py. Do not edit by hand.
 */
export const TANGIBLE_SPRITES = {
  "plate": {
    "w": 1536,
    "h": 1024
  },
  "letters": {
    "w": 2234,
    "h": 485,
    "sprites": [
      {
        "name": "T0",
        "rect": [
          6,
          6,
          332,
          464
        ],
        "source": [
          13,
          138,
          326,
          458
        ],
        "holes": []
      },
      {
        "name": "A1",
        "rect": [
          344,
          6,
          345,
          467
        ],
        "source": [
          269,
          134,
          339,
          461
        ],
        "holes": [
          [
            399,
            267,
            86,
            138
          ]
        ]
      },
      {
        "name": "N2",
        "rect": [
          695,
          6,
          282,
          469
        ],
        "source": [
          615,
          132,
          276,
          463
        ],
        "holes": []
      },
      {
        "name": "G3",
        "rect": [
          983,
          6,
          315,
          471
        ],
        "source": [
          899,
          131,
          309,
          465
        ],
        "holes": []
      },
      {
        "name": "I4",
        "rect": [
          1304,
          6,
          120,
          471
        ],
        "source": [
          1232,
          130,
          114,
          465
        ],
        "holes": []
      },
      {
        "name": "B5",
        "rect": [
          1430,
          6,
          290,
          470
        ],
        "source": [
          1368,
          132,
          284,
          464
        ],
        "holes": [
          [
            1468,
            402,
            91,
            100
          ],
          [
            1468,
            227,
            76,
            76
          ]
        ]
      },
      {
        "name": "L6",
        "rect": [
          1726,
          6,
          237,
          472
        ],
        "source": [
          1665,
          129,
          231,
          466
        ],
        "holes": []
      },
      {
        "name": "E7",
        "rect": [
          1969,
          6,
          259,
          473
        ],
        "source": [
          1906,
          128,
          253,
          467
        ],
        "holes": []
      }
    ]
  },
  "people": {
    "w": 632,
    "h": 315,
    "scale": 0.5,
    "sprites": [
      {
        "name": "maker-phone",
        "rect": [
          6,
          6,
          92,
          296
        ],
        "source": [
          190,
          27,
          179,
          586
        ],
        "holes": []
      },
      {
        "name": "maker-look",
        "rect": [
          104,
          6,
          74,
          302
        ],
        "source": [
          671,
          14,
          142,
          599
        ],
        "holes": []
      },
      {
        "name": "maker-wave",
        "rect": [
          184,
          6,
          112,
          303
        ],
        "source": [
          1150,
          14,
          217,
          600
        ],
        "holes": []
      },
      {
        "name": "muse-walk-a",
        "rect": [
          302,
          6,
          98,
          151
        ],
        "source": [
          169,
          685,
          191,
          296
        ],
        "holes": []
      },
      {
        "name": "muse-walk-b",
        "rect": [
          406,
          6,
          96,
          152
        ],
        "source": [
          656,
          685,
          185,
          297
        ],
        "holes": []
      },
      {
        "name": "muse-wave",
        "rect": [
          508,
          6,
          118,
          151
        ],
        "source": [
          1133,
          686,
          229,
          296
        ],
        "holes": []
      }
    ]
  }
} as const;
