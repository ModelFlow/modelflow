class StarshipUrineStorage:
    name = "('urine_storage',)"
    params = []
    states = [
        {
            "key": "urine",
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
        # TODO: Add max capacity
        if states.urine < 0:
            utils.terminate_sim_with_error("urine < 0")
