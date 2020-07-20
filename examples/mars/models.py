from modelflow.modelflow import Model, ModelParam, ModelState


class HabitatAtmosphere(Model):
    def __init__(self):

        self.name = "habitat_atmosphere"

        # TODO
        # self.depends_on = ["habitat"]

        self.params = [
            ModelParam(
                key="initial_co2",
                label="Initial CO2",
                description="This is the amount of CO2 consumped",
                units="kg",
                minimum=0,
                value=1000,
                maximum=10000,
                notes="not sure about this",
                required=True
            )
        ]

        self.states = [
            ModelState(
                key="co2",
                units="kg",
                value=1000
                # error_if_below=0. # TODO: Implement
            ),
            ModelState(
                key="o2",
                units="kg",
                value=1000
            )
        ]
    # TODO: Handle case for like initial sizing based on size of habitat
    # def setup():


class Plant(Model):
    def __init__(self):
        # TODO: Support this heirarchy
        # self.belongs_to = ["habitat", "mars"]
        self.name = "plant"
        self.parent = "location"

        # NOTE: This might be able to be auto-generated
        self.inputs = [
            "habitat_atmosphere.co2",
            "habitat_atmosphere.o2",
            "location.hours_since_midnight"
        ]

        self.outputs = [
            "habitat_atmosphere.co2",
            "habitat_atmosphere.o2",
            # "food_storage.food"
        ]

        self.params = [
            ModelParam(
                key="day_time_co2_input_per_hour",
                label="Day Time CO2 Consumption",
                description="This is the amount of CO2 consumped",
                units="kg/hr",
                value=10,
                # TODO: Add default value
                minimum=0,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="day_time_co2_output_per_hour",
                label="Day Time O2 Output",
                description="This is the amount of O2 output during the day",
                units="kg/hr",
                value=10,
                minimum=0,
                maximum=10,
                source="https://www.google.com",
                required=False
            ),
            ModelParam(
                key="night_time_co2_output_per_hour",
                label="Night Time CO2 Output",
                description="This is the amount of O2 output at night",
                units="kg/hr",
                value=5,
                # TODO: Add default value
                minimum=0,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="night_time_o2_input_per_hour",
                label="Night Time O2 Input",
                description="This is the amount of O2 input at night day",
                units="kg/hr",
                value=5,
                minimum=0,
                maximum=10,
                source="https://www.google.com",
                required=False
            ),
        ]

        self.states = [
            ModelState(
                key="mass",
                units="kg",
                # initial_val=0,
                value=1000
            )
        ]

    def run_step(self, models, params, states):
        is_daytime = models.location.hours_since_midnight > 5 and models.location.hours_since_midnight < 20
        if is_daytime:
            models.habitat_atmosphere.co2 -= params.day_time_co2_input_per_hour
            models.habitat_atmosphere.o2 += params.day_time_co2_output_per_hour
        else:
            models.habitat_atmosphere.co2 += params.night_time_co2_output_per_hour
            models.habitat_atmosphere.o2 -= params.night_time_o2_input_per_hour

        states.mass += 1

        # TODO: Record changes. Ex: co2 production


# TODO: Converter from csv to models
class Raddish(Plant):
    def __init__(self):
        self.name = "Raddish"
        self.description = "A Raddish type plant"
        self.params = [
            ModelParam(
                key="day_time_co2_consumption",
                value=2.03,
                source="https://www.google.com"
            )
        ]
        # self.inputs, self.outputs, self.states, run_step inhereted


class Location():
    def __init__(self):
        self.name = "location"
        # TODO: Figure out the dependency tree to set which steps to run
        self.priority = 0
        self.states = [
            ModelState(
                key="hours_since_midnight",
                units="hours",
                # initial_val=0,
                value=0
            )
        ]

    def run_step(self, models, params, states):
        if states.hours_since_midnight == 23:
            states.hours_since_midnight = 0
        else:
            states.hours_since_midnight += 1

