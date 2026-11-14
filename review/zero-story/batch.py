import subprocess, sys, concurrent.futures as cf, pathlib
here = pathlib.Path(__file__).parent
jobs = [l.rstrip("\n").split("|", 2) for l in (here / "jobs.tsv").read_text().splitlines() if l.strip()]
def run(j):
    r = subprocess.run([str(here / "gen.sh"), *j], capture_output=True, text=True)
    print(r.stdout.strip(), flush=True)
with cf.ThreadPoolExecutor(4) as ex:
    list(ex.map(run, jobs))
print("BATCH DONE", flush=True)
