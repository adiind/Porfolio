# Round 2: pieces that replace the flat drawn lines (felt, pipe, cord, frames, plates).
# One codex call per image. Only the text prompt is sent out.
import subprocess, pathlib, concurrent.futures as cf

here = pathlib.Path(__file__).parent
LOOK = ("Materials palette only: dark aged walnut wood, deep bottle-green leather or felt, antique brass with soft warm "
        "highlights and gentle wear, cream paper. Lighting: one warm desk lamp from the upper left, soft, no harsh glare. "
        "Photoreal, tactile, finely detailed, restrained and elegant. Absolutely no text, letters, numbers, logos, people or hands.")
CUT = " Truly transparent background with real alpha, no floor, no cast shadow, no backdrop."
ONE = " The object is centred, fully inside the frame, nothing cropped, filling about 85% of the frame."

JOBS = [
    ("felt", "square 1:1", False,
     "A flat seamless material texture filling the entire image edge to edge: deep bottle-green wool baize, the felt of an old "
     "writing desk, seen exactly top-down, evenly lit, very fine short fibres with subtle natural variation. Dark, rich, slightly "
     "desaturated green. No objects, no vignette, no shadows, no seams, no folds, no text."),
    ("pipe", "landscape 3:2", True,
     LOOK + " OBJECT: one perfectly straight, plain horizontal length of antique brass pipe, side view, running across the full "
     "width of the image from the left edge to the right edge and cropped at both edges. Completely uniform along its length: "
     "no joints, flanges, valves or fittings. Thin: about one tenth of the image height, vertically centred." + CUT),
    ("cord", "landscape 3:2", True,
     LOOK + " OBJECT: one perfectly straight horizontal length of vintage braided cloth-covered electrical cord, dark green cloth "
     "with fine gold flecks, running across the full width of the image from the left edge to the right edge and cropped at both "
     "edges. Uniform along its length. Thin: about one fifteenth of the image height, vertically centred." + CUT),
    ("station", "square 1:1", True,
     LOOK + " OBJECT: a short antique brass pipe coupling with a round glass porthole window in its centre, straight-on front view, "
     "with one small round unlit glass indicator lamp on top, and a short stub of brass pipe leaving it on the left and on the "
     "right at the same height. Symmetrical, orthographic." + ONE + CUT),
    ("capsule", "landscape 3:2", True,
     LOOK + " OBJECT: a pneumatic tube mail carrier capsule lying perfectly horizontal, side view: a short antique brass cylinder "
     "with a deep green felt bumper ring at each end and one small brass latch in the middle." + ONE + CUT),
    ("frame", "square 1:1", True,
     LOOK + " OBJECT: a round antique brass portrait frame, straight-on front view, perfectly circular, with a fine beaded rim. "
     "A ring only: the round centre opening is completely empty and fully transparent." + ONE + CUT),
    ("hoop", "square 1:1", True,
     LOOK + " OBJECT: one large, thin circular antique brass hoop seen exactly top-down, perfectly circular, about as thick as a "
     "pencil, with fine engraved tick marks all around it. A ring only: the large area inside it and the area outside it are "
     "fully transparent." + ONE + CUT),
    ("bezel", "landscape 3:2", True,
     LOOK + " OBJECT: an antique brass mechanical counter housing, straight-on front view: a wide rectangular brass plate with one "
     "screw in each corner and one wide rectangular recessed window in the middle showing a plain flat dark empty interior. "
     "No digits, no wheels. Symmetrical, orthographic." + ONE + CUT),
    ("plate", "landscape 3:2", True,
     LOOK + " OBJECT: one small blank rectangular antique brass nameplate, straight-on front view, wide and short, about four times "
     "wider than tall, with one small screw at the left end and one at the right end, softly brushed surface, completely blank. "
     "Perfectly rectangular and axis-aligned." + ONE + CUT),
    ("ruler", "landscape 3:2", True,
     LOOK + " OBJECT: one antique brass ruler lying flat, seen exactly top-down, perfectly horizontal, long and thin, with fine "
     "engraved tick marks along its top edge and no numerals at all." + ONE + CUT),
]


def run(job):
    name, aspect, transparent, prompt = job
    out = here / f"{name}.png"
    if out.exists():
        print("skip", name, flush=True)
        return
    ask = (f"Use your built-in image generation tool to make exactly ONE image with transparent_background="
           f"{'true' if transparent else 'false'}, aspect {aspect}. Prompt: {prompt} After it is generated, copy the PNG file "
           f"into the current directory as {name}.png (do not convert or resize). Then stop. Do not generate anything else and "
           f"do not edit any other file.")
    with open(here / f"log-{name}.txt", "w") as log:
        subprocess.run(["codex", "exec", "-m", "gpt-6-luna", "-c", 'model_reasoning_effort="low"', "-s", "workspace-write",
                        "--skip-git-repo-check", "-C", str(here), ask], stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT)
    print("ok" if out.exists() else "FAIL", name, flush=True)


with cf.ThreadPoolExecutor(4) as ex:
    list(ex.map(run, JOBS))
print("BATCH DONE", flush=True)
