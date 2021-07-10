class Lighting:
    name = "lighting"
    params = [
        {
            "key": "enrg_kwh_use",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 10,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "volume",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):

        states.available_dc_kwh -= min(params.enrg_kwh_use, states.available_dc_kwh)
