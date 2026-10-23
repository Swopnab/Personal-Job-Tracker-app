import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch, MagicMock
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
import update

class UpdateSafety(unittest.TestCase):
    def test_ci_rejects_missing_pending_failed_or_other_branch_runs(self):
        for runs in [[], [{'head_sha':'abc','head_branch':'other','run_number':1,'status':'completed','conclusion':'success'}], [{'head_sha':'abc','head_branch':'main','run_number':1,'status':'in_progress','conclusion':None}], [{'head_sha':'abc','head_branch':'main','run_number':1,'status':'completed','conclusion':'failure'}]]:
            response=__import__('json').dumps({'workflow_runs':runs})
            with patch('subprocess.check_output',return_value=response):
                with self.assertRaises(RuntimeError):update.require_ci('abc')

    def test_clean_worktree_required(self):
        with patch.object(update,'git',return_value=' M app.js'):
            with self.assertRaises(RuntimeError):update.require_clean()

    def test_successful_exact_sha_is_accepted(self):
        response=__import__('json').dumps({'workflow_runs':[{'head_sha':'abc','head_branch':'main','run_number':1,'status':'completed','conclusion':'success'}]})
        with patch('subprocess.check_output',return_value=response):update.require_ci('abc')

if __name__=='__main__':unittest.main()

class ManagedLifecycle(unittest.TestCase):
    def test_restart_keeps_origin_and_private_files(self):
        import tempfile, shutil, socket
        import manage
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory).resolve()
            (root/'scripts').mkdir()
            shutil.copyfile(manage.SERVER,root/'scripts/serve.py')
            private=root/'.local-data'
            private.mkdir()
            snapshot=private/'applications.json'
            snapshot.write_text('{"items":[{"company":"SYNTHETIC_PRIVATE"}]}')
            (root/'index.html').write_text('<h1>Tracker</h1>')
            with socket.socket() as probe:
                probe.bind(('127.0.0.1',0))
                port=probe.getsockname()[1]
            with patch.multiple(manage,ROOT=root,PRIVATE=private,STATE=private/'runtime.json',SERVER=str(root/'scripts/serve.py')):
                try:
                    self.assertEqual(manage.start(port),port)
                    self.assertTrue(manage.healthy(port))
                    self.assertEqual(manage.start(),port)
                    manage.stop()
                    self.assertEqual(manage.start(port),port)
                    self.assertTrue(manage.healthy(port))
                    self.assertIn('SYNTHETIC_PRIVATE',snapshot.read_text())
                finally:manage.stop()
