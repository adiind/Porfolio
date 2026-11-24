#!/bin/bash
# ab.sh <out> <runs> <flags...> : alternate before (4881) / after (4882)
cd "$(dirname "$0")"; out=$1; runs=$2; shift 2; : > $out
for i in $(seq 1 $runs); do for port in 4881 4882; do timeout 170 node probe.mjs http://127.0.0.1:$port/ "$@" >> $out 2>/dev/null; done; done
python3 - "$out" <<'PY'
import json,sys,statistics as st
rows=[json.loads(l) for l in open(sys.argv[1]) if l.strip()]
for port,name in (('4881','before'),('4882','after ')):
    r=[x for x in rows if port in x['url'] and 'error' not in x]
    f=lambda k: [x[k] for x in r]
    print(name,'n',len(r),'| canvas',sorted(f('canvas')),'| dawn',sorted(f('dawn')),'| LIT',sorted(f('litMs')),'med',st.median(f('litMs')),'| tbt',sorted(f('tbt')),'| kb',r[0]['kbBefore'],'req',r[0]['reqBefore'])
PY
