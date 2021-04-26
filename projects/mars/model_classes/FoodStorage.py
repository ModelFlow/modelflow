class FoodStorage:
    name = "food_storage"
    params = [
        {
            "key": "max_food_mass",
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
            "value": 0.0006,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        }
    ]
    states = [
        {
            "key": "food",
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
            "private": True,
            "value": 10000,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        states.mass = states.food
        states.volume = states.mass * params.m3_per_kg

        if states.food > params.max_food_mass:
            states.food = params.max_food_mass
            utils.log("Maximum food storage exceeded so discarded")

        # Note: food consumers are responsible for checking food
        # and not consuming more than is stored
        if states.food < 0:
            utils.terminate_sim_with_error("food < 0")
