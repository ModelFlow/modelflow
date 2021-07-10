class GridSimulator:
    name = "Grid Simulator"
    params = []
    states = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": True,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": True,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):
        states.available_dc_kwh = 0
