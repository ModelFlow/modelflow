class Plants:
    name = "plants",
    params = [
        dict(
            key="co2_consumed",
            units="kg/hr",
            value=0.1,
            source="FAKE",
            min=0,   # Including a min and max automatically creates slider on website
            max=1
        ),
        dict(
            key="o2_produced",
            units="kg/hr",
            value=0.1,
            source="FAKE",
            min=0,
            max=1
        ),
        dict(
            key="mass_increase_per_hour",
            units="kg",
            value=1,
            source="FAKE",
            min=0,
            max=1.5
        )
    ],
    private_states = [
        dict(
            key="plant_mass",
            units="kg",
            value=1.2  # FAKE
        ),
        # TODO: Add health metrics etc, day night cycle, edible etc
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
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
        shared_states.atmo_co2 -= min(params.co2_consumed, shared_states.atmo_co2)

        # Don't generate o2 if we run out of oxygen
        if shared_states.atmo_co2 == 0:
            return

        # Output oxygen
        shared_states.atmo_o2 += params.o2_produced

        # Ensure the plant is growing every day forever :)
        private_states.plant_mass += params.mass_increase_per_hour
