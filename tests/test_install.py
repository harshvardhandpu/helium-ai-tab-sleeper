import importlib.util,json,pathlib,tempfile,unittest
script=pathlib.Path(__file__).resolve().parents[1]/'scripts/install-extension.py'
spec=importlib.util.spec_from_file_location('installer',script);installer=importlib.util.module_from_spec(spec);spec.loader.exec_module(installer)
class Installation(unittest.TestCase):
 def test_owned_upgrade_keeps_backup(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=pathlib.Path(tmp)/'extension';installer.install(dest)
   manifest=json.loads((dest/'manifest.json').read_text());self.assertEqual(manifest['manifest_version'],3)
   (dest/'sentinel').write_text('preserve');installer.install(dest)
   backups=list(dest.parent.glob('extension-backup-*'));self.assertEqual(len(backups),1);self.assertEqual((backups[0]/'sentinel').read_text(),'preserve')
 def test_unrelated_directory_is_preserved(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=pathlib.Path(tmp)/'unrelated';dest.mkdir();(dest/'sentinel').write_text('unchanged')
   with self.assertRaises(ValueError):installer.install(dest)
   self.assertEqual((dest/'sentinel').read_text(),'unchanged')
 def test_symlinked_file_cannot_overwrite_another_file(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=pathlib.Path(tmp)/'extension';installer.install(dest)
   outside=pathlib.Path(tmp)/'unrelated';outside.write_text('unchanged')
   (dest/'worker.mjs').unlink();(dest/'worker.mjs').symlink_to(outside)
   with self.assertRaises(ValueError):installer.install(dest)
   self.assertEqual(outside.read_text(),'unchanged')
if __name__=='__main__':unittest.main()
