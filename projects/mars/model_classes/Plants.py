class Plants:
    name = "('plants',)"
    params = [
        {
            "key": "co2_consumed",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "o2_produced",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "mass_increase_per_hour",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        }
    ]
    states = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": True,
            "value": 1.2,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        """
        The logic for the model goes here:

        args
        io: all of the state available from all other models
        params: constants that can be changed by the user
        states: states internal to the model
        data: (Work in progress) input a CSV of external data for use by model

        returns
        none
        """

        # Take CO2 from the atmosphere either ensuring we don't take
        # more than the atmosphere has
        states.atmo_co2 -= min(params.co2_consumed, states.atmo_co2)

        # Don't generate o2 if we run out of oxygen
        if states.atmo_co2 == 0:
            return

        # Output oxygen
        states.atmo_o2 += params.o2_produced

        # Ensure the plant is growing every day forever :)
        states.plant_mass += params.mass_increase_per_hour
