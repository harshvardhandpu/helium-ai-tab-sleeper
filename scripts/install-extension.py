#!/usr/bin/env python3
"""Install only the owned unpacked extension; never change browser associations."""
import argparse,datetime,json,pathlib,shutil
def install(destination):
 source=pathlib.Path(__file__).resolve().parents[1]/'extension'
 expected=json.loads((source/'manifest.json').read_text())['name']
 if destination.exists():
  manifest=destination/'manifest.json'
  if destination.is_symlink() or not manifest.is_file() or json.loads(manifest.read_text()).get('name')!=expected:
   raise ValueError('Refusing to overwrite an unrelated extension directory')
  if any((destination/item.name).is_symlink() for item in source.iterdir() if item.is_file()):
   raise ValueError('Refusing to overwrite a symlinked extension file')
  stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
  backup=destination.with_name(destination.name+'-backup-'+stamp)
  shutil.copytree(destination,backup)
 destination.mkdir(parents=True,exist_ok=True)
 for item in source.iterdir():
  if item.is_file():shutil.copy2(item,destination/item.name)
 return destination
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--destination',type=pathlib.Path,default=pathlib.Path.home()/'.local/share/helium-tab-sleeper')
 args=parser.parse_args()
 try: print('Installed unpacked extension:',install(args.destination))
 except (ValueError,OSError,json.JSONDecodeError) as e:parser.exit(1,str(e)+'\n')
