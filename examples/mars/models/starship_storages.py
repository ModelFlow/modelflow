
class StarshipPotableWaterStorage:
    name = "Potable Water Storage",
    params = [
        dict(
            key="max_h2o_potb",
            units="kg",
            value=4000,
        ),
        dict(
            key="m3_per_kg",
            units="kg",
            value=0.001,
        )
    ]
    states = [
        dict(
            key="h2o_potb",
            units="kg",
            value=1341,
            min=0,
            max=10000
        ),
        dict(
            key="mass",
            units="kg",
            value=0,
        ),
        dict(
            key="volume",
            units="m3",
            value=0,
        )
    ]

    @staticmethod
    def run_step(io, params, states, data):
        states.mass = states.h2o_potb
        states.volume = states.mass * params.m3_per_kg

        if states.h2o_potb > params.max_h2o_potb:
            states.h2o_potb = params.max_h2o_potb
            utils.log("Maximum food storage exceeded so discarded")

        # Note: h2o_potb consumers are responsible for checking h2o_potb
        # and not consuming more than is stored
        if states.h2o_potb < 0:
            utils.terminate_sim_with_error("h2o_potb < 0")


class StarshipSolidWasteStorage:
    # Note: kg should include container and volume should be set at container
    name = "Solid Waste Storage"
    params = [
        dict(
            key="volume",
            units="m3",
            value=2,
        )
    ]
    states = [
        dict(
            key="solid_waste",
            units="kg",
            value=0
        )
    ]

    @staticmethod
    def run_step(io, params, states, data):
        if states.solid_waste < 0:
            utils.terminate_sim_with_error("solid_waste < 0")


class StarshipLiquidWasteStorage:
    definition = {
        "name": "waste_storage",
        "states": [
            dict(
                key="urin",
                units="kg",
                value=0
            ),
            dict(
                key="other_liquid_waste",
                units="kg",
                value=0
            ),
        ]
    }

    @staticmethod
    def run_step(io, params, states, data):
        if states.h2o_urin < 0:
            raise Exception("h2o_urin < 0")

        if states.h2o_waste < 0:
            raise Exception("h2o_waste < 0")

        if states.solid_waste < 0:
            utils.terminate_sim_with_error("solid_waste < 0")


class FoodStorage:
    name = "food_storage"
    params = [
        dict(
            key="max_food_mass",
            units="kg",
            value=10000,
            min=0,
            max=100000
        ),
        dict(
            key="m3_per_kg",
            units="kg",
            value=1,
            source='fake'
        )
     ]
    states = [
        dict(  # By default states are public
            key="food",
            # alias="mass",  # TODO: Support aliasing
            units="kg",
            value=1000
        ),
        dict(
            key="mass",
            units="kg",
            value=1000,  # will be calculated
            private=True,  # This is so there is no naming conflict. Note this can still be accessible by utility functions
        ),
        dict(
            key="volume",
            units="m3",
            value=0,
            private=True,  # This is so there is no naming conflict. Note this can still be accessible by utility functions
        )
    ]

    # @staticmethod
    # def setup(io, params, states, data):
    #     states.food_edbl = params.max_food_edbl

    # @staticmethod
    # def cost(params, states):
    #     return states.food_edbl

    @staticmethod
    def run_step(io, params, states, data, utils):
        states.mass = states.food
        states.volume = states.mass * params.m3_per_kg

        if states.food > params.max_food_mass:
            states.food = params.max_food_mass
            utils.log("Maximum food storage exceeded so discarded")

        # Note: food consumers are responsible for checking food
        # and not consuming more than is stored
        if states.food < 0:
            utils.terminate_sim_with_error("food < 0")
