/**
 * JARVIS_VOICE: real recordings of the phrase "Jarvis Lights On", read from the owner's firmware repo adiind/diy-jarvis
 * on 2026-11-15. Nothing is resampled, smoothed or invented.
 *
 * WHAT voice_model.h IS  (diy-jarvis/diy-jarvis/voice_model.h, 13456 lines; byte-identical copy in "Voice Model Creation/")
 *  - 60 arrays = 10 phrases x 6 recordings. Names: <phrase>_<0..5>, e.g. jarvis_lights_on_0 (voice_model.h:4045).
 *    Each has a partner constant fram_num_<phrase>_<n>, e.g. fram_num_jarvis_lights_on_0 = 92 (voice_model.h:4043).
 *  - Every array is declared `const int16_t name[vv_frm_max*mfcc_num]` = 219 * 12 = 2628 numbers
 *    (vv_frm_max: util/MFCC.h:15-16, (2200-20)/(20-10)+1 = 219; mfcc_num: util/MFCC.h:13 = 12). Verified: all 60 hold 2628 values.
 *  - One RECORDING = one array. One ROW of 12 numbers = one FRAME of features (12 MFCC coefficients,
 *    struct v_ftr_tag mfcc_dat, util/MFCC.h:24-30). A frame covers 20 ms of 8 kHz audio and frames start 10 ms apart
 *    (util/VAD.h:7-8, util/ADC.h:5), so 92 frames is roughly 0.93 s of speech.
 *  - The recording's length is the fram_num_ constant, not stored in the array. Only the first fram_num * 12 numbers are real;
 *    the rest of the 2628 are zero padding (verified: no non-zero value past the frame count in any of the six).
 *  - Number format: signed 16-bit integers. Each filter-bank log energy is log(x)*100 (util/MFCC.c:215), turned into 12 coefficients
 *    by an integer DCT (util/MFCC.c:218-228), then the WHOLE recording is normalised: subtract the mean of all its numbers and divide
 *    by their standard deviation, times 100 (util/MFCC.c:233, normalize at :264-273, line 272). So values are "100 = one standard
 *    deviation of this recording", in a range of about -316 to +424 here. They are unitless and NOT comparable between recordings in absolute terms.
 *  - How the file was made: the board printed each recording as text (print_model, lib.cpp:175-187), the owner saved the serial output
 *    with CoolTerm (README "CoolTerm Configuration"), and "Voice Model Creation/voice_model_compiler.ipynb" cut it into these arrays.
 *    I checked: the six blocks in "Voice Model Text Files/jarvis_lights_on.txt" equal these six arrays number for number.
 *
 * WHICH PHRASE: README id 6 "Jarvis Lights On". In the sketch that is `case 6:  // jarvis_lights_on` (diy-jarvis.ino:387), loaded by
 *  `rec.addVoiceModel(5, k, jarvis_lights_on_k, fram_num_jarvis_lights_on_k)` (diy-jarvis.ino:493-498): keyword index 5 = id 6
 *  (the library returns index + 1, lib.cpp:432).
 *
 * WHAT THE TRACK IS: `takes` holds coefficient index 0 of each frame (the first of the 12 numbers in the row), taken straight from the array.
 *  There is NO energy or loudness number in this data. Coefficient 0 is not the overall level: the DCT table's first row
 *  (util/MFCC_Arg.h:120) is 100, 98, 95 ... -98, -100, a single half-cosine across the 24 filter bands, so it measures how the
 *  spectrum is tilted between low and high bands (high = more weight in low bands), and the whole-recording normalisation removes absolute level anyway.
 *  It still rises and falls with the syllables, which is why it is a usable shape to draw, but call it "first coefficient", not "loudness".
 *  Frame 0 of every take is -71 to -86, far below frame 1 (94 to 205). I could not determine why (it may be an edge effect of the
 *  first frame; it is not shown to be silence). It is left in as stored.
 *
 * AVERAGING / ALIGNMENT: none stored. The six recordings are kept separate in the file and never averaged into a template.
 *  At recognition time each is compared with the spoken phrase by dynamic time warping and the six distances are averaged
 *  (see JARVIS_FIRMWARE.match). Lengths differ (80 to 98 frames) because nothing aligns them here.
 *
 * takesUnit: a second copy for drawing only. For each take separately: (value - min of that take) / (max - min of that take), rounded to 4 decimals.
 */

export const JARVIS_VOICE = {
  phrase: 'Jarvis Lights On',
  readmeId: 6,
  modelIndex: 5,
  coefficient: 0,
  coefficientsPerFrame: 12,
  frameMs: 20,
  hopMs: 10,
  sampleRateHz: 8000,
  scale: 'int16 as stored; recording-wide z-score x 100 (100 = one standard deviation of that recording). Unitless.',
  frames: [92, 89, 98, 80, 96, 87],
  takes: [
    [-71, 195, 189, 206, 245, 199, 96, 61, 32, 67, 152, 224, 314, 339, 265, 265, 301, 277, 274, 298, 320, 335, 304, 305, 325, 365, 346, 360, 346, 337, 367, 389, 341, 304, 293, 284, 279, 283, 274, 224, 107, 36, 101, 62, 58, 110, 140, 103, 113, 37, -49, 177, 299, 350, 346, 325, 297, 300, 313, 278, 290, 306, 302, 273, 283, 294, 258, 248, 232, 206, 228, 223, 166, 134, 148, 100, 116, 130, 88, 17, 20, 0, 93, 237, 295, 328, 320, 383, 355, 344, 360, 343],
    [-86, 204, 184, 216, 214, 232, 260, 108, -52, -89, -88, 67, 143, 174, 167, 188, 226, 176, 197, 266, 231, 282, 268, 214, 305, 261, 254, 353, 341, 328, 297, 286, 295, 316, 370, 403, 386, 337, 326, 233, 247, 250, 158, 114, 72, 129, 60, 59, 146, 204, 62, 90, 268, 308, 321, 339, 398, 402, 391, 343, 300, 302, 354, 303, 331, 275, 262, 269, 274, 203, 239, 239, 293, 313, 178, 15, 88, 118, 45, -63, 12, -69, -98, -102, -10, 164, 248, 278, 321],
    [-77, 205, 204, 223, 206, 198, 143, 158, 137, -13, -122, -96, 28, 164, 232, 283, 262, 299, 322, 323, 315, 242, 284, 273, 283, 368, 381, 394, 382, 359, 352, 380, 360, 347, 355, 392, 409, 405, 343, 314, 273, 215, 235, 243, 141, 132, 59, 43, 19, 81, 121, 101, 146, 120, -16, 33, 146, 307, 335, 344, 362, 390, 316, 291, 262, 261, 235, 256, 294, 312, 309, 288, 232, 165, 160, 236, 294, 215, 111, 69, 69, 26, -2, -22, -70, -101, -63, -117, 76, 221, 274, 359, 400, 364, 333, 335, 316, 338],
    [-84, 94, 122, 174, 205, 176, 169, 57, -138, -176, -124, -24, 91, 159, 214, 197, 220, 254, 238, 270, 279, 351, 339, 319, 322, 282, 298, 315, 364, 354, 348, 343, 399, 371, 337, 369, 375, 350, 332, 272, 211, 136, 103, 52, 73, 178, 191, 198, 140, 83, 82, 83, 145, 280, 281, 309, 329, 321, 269, 232, 269, 291, 342, 277, 269, 332, 341, 277, 150, 169, 236, 291, 207, 123, 48, -35, -19, -23, -60, 5],
    [-79, 140, 166, 135, 150, 114, 15, -178, -266, -238, -67, 98, 149, 205, 154, 139, 193, 199, 135, 220, 190, 237, 238, 245, 289, 289, 317, 318, 324, 310, 313, 285, 321, 363, 312, 358, 295, 280, 208, 222, 224, 92, 137, 44, -32, 5, 96, 113, 145, 204, 111, 21, -77, -51, 104, 283, 324, 365, 348, 375, 380, 325, 346, 333, 308, 304, 293, 308, 315, 337, 309, 267, 241, 149, 208, 168, 203, 79, 84, 79, 56, 60, -7, -31, -92, -108, -11, 118, 206, 288, 312, 339, 304, 259, 204, 247],
    [-85, 97, 130, 92, 168, 102, 94, 59, 31, -119, -282, -114, 10, 213, 210, 221, 226, 200, 248, 228, 171, 230, 230, 264, 309, 309, 279, 292, 323, 330, 335, 352, 368, 388, 379, 417, 424, 397, 388, 341, 252, 53, 181, 138, 91, 81, 26, 48, 137, 109, 124, 192, 109, 50, -26, 178, 326, 349, 346, 353, 316, 267, 260, 329, 323, 300, 346, 321, 345, 319, 238, 129, 154, 205, 199, 192, 75, 46, 33, -30, -38, -30, -39, -95, -77, 14, 179],
  ],
  takesUnit: [
    [0.0, 0.5783, 0.5652, 0.6022, 0.687, 0.587, 0.363, 0.287, 0.2239, 0.3, 0.4848, 0.6413, 0.837, 0.8913, 0.7304, 0.7304, 0.8087, 0.7565, 0.75, 0.8022, 0.85, 0.8826, 0.8152, 0.8174, 0.8609, 0.9478, 0.9065, 0.937, 0.9065, 0.887, 0.9522, 1.0, 0.8957, 0.8152, 0.7913, 0.7717, 0.7609, 0.7696, 0.75, 0.6413, 0.387, 0.2326, 0.3739, 0.2891, 0.2804, 0.3935, 0.4587, 0.3783, 0.4, 0.2348, 0.0478, 0.5391, 0.8043, 0.9152, 0.9065, 0.8609, 0.8, 0.8065, 0.8348, 0.7587, 0.7848, 0.8196, 0.8109, 0.7478, 0.7696, 0.7935, 0.7152, 0.6935, 0.6587, 0.6022, 0.65, 0.6391, 0.5152, 0.4457, 0.4761, 0.3717, 0.4065, 0.437, 0.3457, 0.1913, 0.1978, 0.1543, 0.3565, 0.6696, 0.7957, 0.8674, 0.85, 0.987, 0.9261, 0.9022, 0.937, 0.9],
    [0.0317, 0.6059, 0.5663, 0.6297, 0.6257, 0.6614, 0.7168, 0.4158, 0.099, 0.0257, 0.0277, 0.3347, 0.4851, 0.5465, 0.5327, 0.5743, 0.6495, 0.5505, 0.5921, 0.7287, 0.6594, 0.7604, 0.7327, 0.6257, 0.8059, 0.7188, 0.705, 0.901, 0.8772, 0.8515, 0.7901, 0.7683, 0.7861, 0.8277, 0.9347, 1.0, 0.9663, 0.8693, 0.8475, 0.6634, 0.6911, 0.697, 0.5149, 0.4277, 0.3446, 0.4574, 0.3208, 0.3188, 0.4911, 0.6059, 0.3248, 0.3802, 0.7327, 0.8119, 0.8376, 0.8733, 0.9901, 0.998, 0.9762, 0.8812, 0.796, 0.8, 0.903, 0.802, 0.8574, 0.7465, 0.7208, 0.7347, 0.7446, 0.604, 0.6752, 0.6752, 0.7822, 0.8218, 0.5545, 0.2317, 0.3762, 0.4356, 0.2911, 0.0772, 0.2257, 0.0653, 0.0079, 0.0, 0.1822, 0.5267, 0.6931, 0.7525, 0.8376],
    [0.0847, 0.6158, 0.6139, 0.6497, 0.6177, 0.6026, 0.4991, 0.5273, 0.4878, 0.2053, 0.0, 0.049, 0.2825, 0.5386, 0.6667, 0.7627, 0.7232, 0.7928, 0.8362, 0.838, 0.823, 0.6855, 0.7646, 0.7439, 0.7627, 0.9228, 0.9473, 0.9718, 0.9492, 0.9058, 0.8927, 0.9454, 0.9077, 0.8832, 0.8983, 0.968, 1.0, 0.9925, 0.8757, 0.8211, 0.7439, 0.6347, 0.6723, 0.6874, 0.4953, 0.4783, 0.3409, 0.3107, 0.2655, 0.3823, 0.4576, 0.42, 0.5047, 0.4557, 0.1996, 0.2919, 0.5047, 0.8079, 0.8606, 0.8776, 0.9115, 0.9642, 0.8249, 0.7778, 0.7232, 0.7213, 0.6723, 0.7119, 0.7834, 0.8173, 0.8117, 0.7721, 0.6667, 0.5405, 0.5311, 0.6742, 0.7834, 0.6347, 0.4388, 0.3597, 0.3597, 0.2787, 0.226, 0.1883, 0.0979, 0.0395, 0.1111, 0.0094, 0.3729, 0.646, 0.7458, 0.9058, 0.9831, 0.9153, 0.8569, 0.8606, 0.8249, 0.8663],
    [0.16, 0.4696, 0.5183, 0.6087, 0.6626, 0.6122, 0.6, 0.4052, 0.0661, 0.0, 0.0904, 0.2643, 0.4643, 0.5826, 0.6783, 0.6487, 0.6887, 0.7478, 0.72, 0.7757, 0.7913, 0.9165, 0.8957, 0.8609, 0.8661, 0.7965, 0.8243, 0.8539, 0.9391, 0.9217, 0.9113, 0.9026, 1.0, 0.9513, 0.8922, 0.9478, 0.9583, 0.9148, 0.8835, 0.7791, 0.673, 0.5426, 0.4852, 0.3965, 0.433, 0.6157, 0.6383, 0.6504, 0.5496, 0.4504, 0.4487, 0.4504, 0.5583, 0.793, 0.7948, 0.8435, 0.8783, 0.8643, 0.7739, 0.7096, 0.7739, 0.8122, 0.9009, 0.7878, 0.7739, 0.8835, 0.8991, 0.7878, 0.567, 0.6, 0.7165, 0.8122, 0.6661, 0.52, 0.3896, 0.2452, 0.273, 0.2661, 0.2017, 0.3148],
    [0.2895, 0.6285, 0.6687, 0.6207, 0.644, 0.5882, 0.435, 0.1362, 0.0, 0.0433, 0.308, 0.5635, 0.6424, 0.7291, 0.6502, 0.6269, 0.7105, 0.7198, 0.6207, 0.7523, 0.7059, 0.7786, 0.7802, 0.791, 0.8591, 0.8591, 0.9025, 0.904, 0.9133, 0.8916, 0.8963, 0.8529, 0.9087, 0.9737, 0.8947, 0.9659, 0.8684, 0.8452, 0.7337, 0.7554, 0.7585, 0.5542, 0.6238, 0.4799, 0.3622, 0.4195, 0.5604, 0.5867, 0.6362, 0.7276, 0.5836, 0.4443, 0.2926, 0.3328, 0.5728, 0.8498, 0.9133, 0.9768, 0.9505, 0.9923, 1.0, 0.9149, 0.9474, 0.9272, 0.8885, 0.8824, 0.8653, 0.8885, 0.8994, 0.9334, 0.8901, 0.8251, 0.7848, 0.6424, 0.7337, 0.6718, 0.726, 0.5341, 0.5418, 0.5341, 0.4985, 0.5046, 0.4009, 0.3638, 0.2693, 0.2446, 0.3947, 0.5944, 0.7307, 0.8576, 0.8947, 0.9365, 0.8824, 0.8127, 0.7276, 0.7941],
    [0.279, 0.5368, 0.5836, 0.5297, 0.6374, 0.5439, 0.5326, 0.483, 0.4433, 0.2309, 0.0, 0.238, 0.4136, 0.7011, 0.6969, 0.7125, 0.7195, 0.6827, 0.7507, 0.7224, 0.6416, 0.7252, 0.7252, 0.7734, 0.8371, 0.8371, 0.7946, 0.813, 0.8569, 0.8669, 0.8739, 0.898, 0.9207, 0.949, 0.9363, 0.9901, 1.0, 0.9618, 0.949, 0.8824, 0.7564, 0.4745, 0.6558, 0.5949, 0.5283, 0.5142, 0.4363, 0.4674, 0.5935, 0.5538, 0.5751, 0.6714, 0.5538, 0.4703, 0.3626, 0.6516, 0.8612, 0.8938, 0.8895, 0.8994, 0.847, 0.7776, 0.7677, 0.8654, 0.8569, 0.8244, 0.8895, 0.8541, 0.8881, 0.8513, 0.7365, 0.5822, 0.6176, 0.6898, 0.6813, 0.6714, 0.5057, 0.4646, 0.4462, 0.3569, 0.3456, 0.3569, 0.3442, 0.2649, 0.2904, 0.4193, 0.653],
  ],
} as const
