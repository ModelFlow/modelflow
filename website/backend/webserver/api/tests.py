from django.test import TestCase
from .models import Project

class ModelClassTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Project.objects.create(name="Test Project")

    def test_new_model_class(self):
        body = {
            "name": "test",
            "description": "desc",
            "project": 1,
            "parameters": [
                {
                    "name": "param1",
                    "units": "m3",
                    "is_private": False,
                    "value": "1",
                    "dtype": "float",
                    "source": "source",
                    "notes": "notes"
                }
            ],
            "states": [
                {
                    "name": "state1",
                    "units": "kg",
                    "is_private": False,
                    "value": "5",
                    "dtype": "float",
                    "source": "source2",
                    "notes": "notes2"
                }
            ],
            "code": "def run_step(states, params, utils):\n    states.state1 += params.param1"
        }
        response = self.client.post('/api/new_model_class', body, content_type='application/json')
        self.assertEqual(response.status_code, 200)
