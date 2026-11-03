"""Paired baseline/candidate measurements using disposable native repositories."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import statistics
import subprocess
import tempfile
import time
import types
from gitcraft.engine import Lab

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--baseline',default='df561a4',help='Baseline Git commit hash (default: df561a4). Requires local history.')
parser.add_argument('--pairs',type=int,default=3)
parser.add_argument('--output',type=Path,default=Path('artifacts/performance-results.json'))
args=parser.parse_args()
if not re.fullmatch(r'[0-9a-fA-F]{7,64}',args.baseline) or args.pairs<1:
    parser.error('Use a Git commit hash and at least one pair.')
source=subprocess.run(['git','show',args.baseline+':gitcraft/engine.py'],cwd=Path(__file__).resolve().parents[1],check=True,capture_output=True).stdout
baseline=types.ModuleType('baseline_engine')
exec(compile(source,'baseline_engine.py','exec'),baseline.__dict__)

def sequence(cls, root, legacy_startup):
    git, undo, signature = cls._git, cls._save_undo, cls._repo_signature
    counters={'gitProcesses':0,'gitMs':0,'undoMs':0,'signatureMs':0}
    rows=[]
    def timed_git(self,*args,**kwargs):
        start=time.perf_counter()
        try:return git(self,*args,**kwargs)
        finally:
            counters['gitProcesses']+=1
            counters['gitMs']+=(time.perf_counter()-start)*1000
    def timed_undo(self):
        start=time.perf_counter()
        try:return undo(self)
        finally:counters['undoMs']+=(time.perf_counter()-start)*1000
    def timed_signature(self,*args):
        start=time.perf_counter()
        try:return signature(self,*args)
        finally:counters['signatureMs']+=(time.perf_counter()-start)*1000
    cls._git,cls._save_undo,cls._repo_signature=timed_git,timed_undo,timed_signature
    def measure(action, fn):
        for key in counters:counters[key]=0
        start=time.perf_counter();result=fn()
        rows.append({'action':action,'ms':round((time.perf_counter()-start)*1000,2),**{k:round(v,2) for k,v in counters.items()}})
        if isinstance(result,dict) and 'code' in result:assert result['code']==0,result
        return result
    try:
        def startup():
            if legacy_startup:cls(root/'staging','staging').state()
            lab=cls(root/'playground','playground');lab.state();return lab
        lab=measure('startup_to_initial_playground_state',startup)
        measure('warm_status',lambda:lab.command('you','git status'))
        content='# Little Leaf Books\n\nSaturday reading club at 10:00.\n'
        measure('save',lambda:lab.edit('you','README.md',content))
        measure('stage',lambda:lab.command('you','git add README.md'))
        measure('commit',lambda:lab.command('you','git commit -m "Document reading club"'))
        measure('push',lambda:lab.command('you','git push origin main'))
        measure('fetch',lambda:lab.command('sam','git fetch origin'))
        measure('merge',lambda:lab.command('sam','git merge origin/main'))
        assert lab.state()['views']['sam']['files']['README.md']['committed']==content
        return rows
    finally:cls._git,cls._save_undo,cls._repo_signature=git,undo,signature

samples=[]
with tempfile.TemporaryDirectory(prefix='gitcraft-paired-perf-') as root:
    for pair in range(args.pairs):
        for variant in (['baseline','candidate'] if pair%2==0 else ['candidate','baseline']):
            cls=baseline.Lab if variant=='baseline' else Lab
            rows=sequence(cls,Path(root)/f'{pair}-{variant}',variant=='baseline')
            samples.append({'pair':pair+1,'variant':variant,'actions':rows})
            print(f'Completed pair {pair+1}: {variant}',flush=True)
summary=[]
for action in samples[0]['actions']:
    name=action['action'];entry={'action':name}
    for variant in ('baseline','candidate'):
        rows=[row for sample in samples if sample['variant']==variant for row in sample['actions'] if row['action']==name]
        entry[variant]={k:round(statistics.median(row[k] for row in rows),2) for k in ('ms','gitProcesses','gitMs','undoMs','signatureMs')}
        entry[variant]['minMs']=min(row['ms'] for row in rows);entry[variant]['maxMs']=max(row['ms'] for row in rows)
    entry['medianReductionPercent']=round(100*(1-entry['candidate']['ms']/entry['baseline']['ms']),1)
    summary.append(entry)
result={'recordedAtUtc':datetime.now(timezone.utc).isoformat(),'baselineCommit':args.baseline,'method':f'{args.pairs} paired disposable fixture sequences; interleaved order; median/min/max, not tail percentiles; engine timings exclude HTTP/browser; startup includes obsolete staging only in baseline','summary':summary,'samples':samples}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,indent=2),flush=True)
