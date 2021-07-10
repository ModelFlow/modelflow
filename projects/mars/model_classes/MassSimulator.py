class MassSimulator:
    name = "Mass Simulator"
    params = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 100000000,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 100000000,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):
        pass
