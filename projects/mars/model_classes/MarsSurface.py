class MarsSurface:
    name = "Mars Surface"
    params = []
    states = [
        {
            "key": "atmospheric_co2",
            "label": "Atmospheric CO2",
            "units": "kg",
            "private": False,
            "value": 999999999,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "temperature",
            "label": "Temperature",
            "units": "c",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        # TODO: Have temperature change with time
        pass
