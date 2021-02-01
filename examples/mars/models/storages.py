class WaterStorage:
    definition = {
        "name": "water_storage",
        "states": [
            dict(
                key="h2o_potb",
                units="kg",
                value=1341,
                min=0,
                max=10000
            ),
            dict(
                key="h2o_tret",
                units="kg",
                value=0
            )
        ],
        "params": [
            dict(
                key="max_h2o_potb",
                units="kg",
                value=4000,
            ),
            dict(
                key="max_h2o_tret",
                units="kg",
                value=4000,
            )
        ]
    }


    @staticmethod
    def setup(io, params, states, data):
        states.h2o_potb = params.max_h2o_potb

    @staticmethod
    def cost(params, states):
        return states.h2o_potb

    @staticmethod
    def run_step(io, params, states, data):
        if states.h2o_potb > params.max_h2o_potb:
           states.h2o_potb = params.max_h2o_potb
        if states.h2o_potb < 0:
            raise Exception("h2o_potb < 0")

        if states.h2o_tret > params.max_h2o_tret:
           states.h2o_tret = params.max_h2o_tret
        if states.h2o_tret < 0:
            raise Exception("h2o_tret < 0")


class WasteStorage:
    definition = {
        "name": "waste_storage",
        "states": [
            dict(
                key="h2o_urin",
                units="kg",
                value=0
            ),
            dict(
                key="h2o_waste",
                units="kg",
                value=0
            ),
            dict(
                key="solid_waste",
                units="kg",
                value=0
            )
        ]
    }

    @staticmethod
    def run_step(io, params, states, data):
        if states.h2o_urin < 0:
            raise Exception("h2o_urin < 0")

        if states.h2o_waste < 0:
            raise Exception("h2o_waste < 0")

        if states.solid_waste < 0:
            raise Exception("solid_waste < 0")


class FoodStorage:

    definition = {
        "name": "food_storage",
        "states": [
            dict(
                key="food_edbl",
                units="kg",
                value=1000
            )
        ],
        "params": [
            dict(
                key="max_food_edbl",
                units="kg",
                value=10000,
                min=0,
                max=100000
            )
        ]
    }


    @staticmethod
    def setup(io, params, states, data):
        states.food_edbl = params.max_food_edbl

    @staticmethod
    def cost(params, states):
        return states.food_edbl

    @staticmethod
    def run_step(io, params, states, data):
        if states.food_edbl > params.max_food_edbl:
           states.food_edbl = params.max_food_edbl
        if states.food_edbl < 0:
            raise Exception("food_edbl < 0")
