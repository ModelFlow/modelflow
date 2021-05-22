class StarshipSolidWasteStorage:
    name = "Solid Waste Storage"
    params = [
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 2,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    states = [
        {
            "key": "solid_waste",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):
        if states.solid_waste < 0:
            utils.terminate_sim_with_error("solid_waste < 0")
