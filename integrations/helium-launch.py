#!/usr/bin/env python3
"""Personal Helium sleeps tabs; automation uses a separate protected profile."""
import json,os,pathlib,sys,tempfile
ROOT=pathlib.Path.home()
REAL=pathlib.Path(os.environ.get('HELIUM_REAL_BINARY',str(ROOT/'.local/opt/helium/current/helium-wrapper'))).expanduser()
PERSONAL=ROOT/'.config/helium'
AGENT=ROOT/'.config/helium-agent'
EXTENSION=ROOT/'.local/share/helium-tab-sleeper'
args=sys.argv[1:]
agent=bool(args and args[0]=='--agent-profile')
if agent: args=args[1:]
automation=any(a.startswith(('--remote-debugging-','--headless','--enable-automation')) for a in args)
custom=any(a=='--user-data-dir' or a.startswith('--user-data-dir=') for a in args)
selected_profile=None
profile_switches=0
for i,a in enumerate(args):
 if a.startswith('--user-data-dir='):
  profile_switches+=1
  if not a.split('=',1)[1]:sys.exit('Missing --user-data-dir value')
  selected_profile=pathlib.Path(a.split('=',1)[1]).expanduser().resolve()
 elif a=='--user-data-dir':
  profile_switches+=1
  if i+1>=len(args) or args[i+1].startswith('--'):sys.exit('Missing --user-data-dir value')
  selected_profile=pathlib.Path(args[i+1]).expanduser().resolve()
if profile_switches>1:sys.exit('Supply only one --user-data-dir')
if agent and selected_profile:
 managed=ROOT/'.config/helium-agent-profiles'
 temporary=selected_profile.parent==pathlib.Path(tempfile.gettempdir()).resolve() and selected_profile.name.startswith(('playwright_','agent-browser-'))
 if not (selected_profile==AGENT.resolve() or selected_profile.is_relative_to(managed.resolve()) or temporary):
  sys.exit('helium-agent accepts only protected agent profiles or driver-created temporary profiles.')
 AGENT=selected_profile
if agent or (automation and not custom):
 AGENT.mkdir(parents=True,exist_ok=True,mode=0o700)
 # The profile is seeded once, before its first launch. Existing running
 # browser preferences are never edited behind the browser's back.
 if not (AGENT/'Local State').exists():
  (AGENT/'Default').mkdir(exist_ok=True)
  (AGENT/'Local State').write_text(json.dumps({'performance_tuning':{'high_efficiency_mode':{'state':0},'tab_freezing':{'enabled':False}},'background_mode':{'enabled':False}}))
  (AGENT/'Default/Preferences').write_text(json.dumps({'net':{'network_prediction_options':2}}))
 args=[*([] if custom else [f'--user-data-dir={AGENT}']),'--no-first-run','--no-default-browser-check',*args]
elif not custom:
 args=[f'--load-extension={EXTENSION}',*args]
elif automation:
 # Refuse explicitly targeting the personal profile, where a tab sleeper is
 # installed, instead of silently risking an in-progress agent task.
 for i,a in enumerate(args):
  p=a.split('=',1)[1] if a.startswith('--user-data-dir=') else (args[i+1] if a=='--user-data-dir' and i+1<len(args) else None)
  if p and pathlib.Path(p).expanduser().resolve()==PERSONAL.resolve():
   sys.exit('Use helium-agent or a separate --user-data-dir for automation. Personal Helium has a tab sleeper.')
os.execv(str(REAL),[str(REAL),*args])
