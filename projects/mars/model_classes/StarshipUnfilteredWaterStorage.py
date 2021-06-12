class StarshipUnfilteredWaterStorage:
    name = "StarshipUnfilteredWaterStorage"
    params = []
    states = [
        {
            "key": "unfiltered_water",
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
        if states.unfiltered_water < 0:
            utils.terminate_sim_with_error("unfiltered_water < 0")
