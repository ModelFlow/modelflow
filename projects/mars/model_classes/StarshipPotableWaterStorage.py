class StarshipPotableWaterStorage:
    name = "StarshipPotableWaterStorage"
    params = [
        {
            "key": "max_potable_water",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 10000,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "m3_per_kg",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0.001,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    states = [
        {
            "key": "potable_water",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 10000,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        states.mass = states.potable_water
        states.volume = states.mass * params.m3_per_kg

        if states.potable_water > params.max_potable_water:
            states.potable_water = params.max_potable_water
            utils.log("Maximum food storage exceeded so discarded")

        # Note: potable_water consumers are responsible for checking potable_water
        # and not consuming more than is stored
        if states.potable_water < 0:
            utils.terminate_sim_with_error("potable_water < 0")
