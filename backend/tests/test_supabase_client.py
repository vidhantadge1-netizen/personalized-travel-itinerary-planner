import unittest
from unittest import mock

from db.supabase_client import is_supabase_configured, key_role


class SupabaseClientTests(unittest.TestCase):
    def test_empty_key_role(self):
        self.assertEqual(key_role(""), "missing")

    def test_publishable_key_treated_as_anon(self):
        self.assertEqual(key_role("sb_publishable_example"), "anon")

    def test_secret_key_rejected_as_service_role(self):
        self.assertEqual(key_role("sb_secret_example"), "service_role")

    def test_jwt_anon_role(self):
        # header.payload.signature — payload is {"role":"anon"}
        token = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYW5vbiJ9.sig"
        self.assertEqual(key_role(token), "anon")

    def test_jwt_service_role(self):
        token = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.sig"
        self.assertEqual(key_role(token), "service_role")

    def test_not_configured_without_env_key(self):
        with unittest.mock.patch.dict("os.environ", {"SUPABASE_KEY": "", "SUPABASE_URL": ""}):
            self.assertFalse(is_supabase_configured())


if __name__ == "__main__":
    unittest.main()
