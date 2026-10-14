import pathlib,subprocess,sys,unittest
SCRIPT=pathlib.Path(__file__).resolve().parents[1]/'integrations/helium-launch.py'
class LauncherArguments(unittest.TestCase):
 def check_refusal(self,args,message):
  r=subprocess.run([sys.executable,str(SCRIPT),*args],text=True,capture_output=True)
  self.assertNotEqual(r.returncode,0);self.assertIn(message,r.stderr)
 def test_missing_profile_value_is_rejected(self):
  self.check_refusal(['--agent-profile','--user-data-dir'],'Missing --user-data-dir value')
  self.check_refusal(['--agent-profile','--user-data-dir='],'Missing --user-data-dir value')
 def test_duplicate_profile_switches_are_rejected(self):
  self.check_refusal(['--agent-profile','--user-data-dir=/tmp/one','--user-data-dir=/tmp/two'],'Supply only one')
 def test_personal_profile_is_refused_in_agent_mode(self):
  self.check_refusal(['--agent-profile','--user-data-dir='+str(pathlib.Path.home()/'.config/helium')],'only protected agent profiles')
if __name__=='__main__':unittest.main()
