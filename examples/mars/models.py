from modelflow.modelflow import Model, ModelParam, ModelState

# class Habitat(Model):
#     pass

class PotableWaterStorage(Model):
    def setup(self):
        # TODO: make automatic naming
        # Think about how all these configurations need
        # to be scaled during setup.
        self.name = "potable_water_storage"
        self.states = [
            ModelState(
                key="h2o",
                units="kg",
                value=1341
            )
        ]

class WasteStorage(Model):
    def setup(self):
        # NOTE: This is somewhat temporary
        self.name = "waste_storage"
        self.states = [
            ModelState(
                key="h2o_urin",
                units="kg",
                value=0 # TODO: This number does not seem realistic
                # Implement comment system
            )
        ]

class FoodStorage(Model):
    def setup(self):
        self.name = "food_storage"
        self.states = [
            ModelState(
                key="food",
                units="kg",
                value=100 # TODO: This number does not seem realistic
                # Implement comment system
            )
        ]

class HabitatAtmosphere(Model):
    def setup(self):

        self.name = "habitat_atmosphere"

        # TODO
        # self.depends_on = ["habitat"]

        self.params = [
            # ModelParam(
            #     key="initial_co2",
            #     label="Initial CO2",
            #     description="This is the amount of CO2 consumped",
            #     units="kg",
            #     value=0.7698085,
            #     notes="not sure about this",
            #     required=True
            # )
        ]

        # "atmo_o2": 390.11925,
        # "atmo_co2": 0.7698085,
        # "atmo_n2": 1454.3145000000002,
        # "atmo_ch4": 0.003482875,
        # "atmo_h2": 0.0010243750000000001,
        # "atmo_h2o": 18.625
        # TODO: Make atmospheric concentration based on
        # size of the habitat instead of hard coded

        # TODO: Handle initialization of model states better
        # Maybe make every first model state a parameter
        self.states = [
            ModelState(
                key="co2",
                units="kg",
                value=0.7698085
                # error_if_below=0. # TODO: Implement
            ),
            ModelState(
                key="o2",
                units="kg",
                value=390.11925
            ),
            ModelState(
                key="n2",
                units="kg",
                value=1454.3145000000002
            ),
            ModelState(
                key="h2o",  # water vapor
                units="kg",
                value=1454.3145000000002
            )
        ]

        # TODO: Concept of calculated states. Ex: concentration of co2

        # TODO: Handle case for like initial sizing based on size of habitat




class Human(Model):
    def setup(self):
        self.name = "human"
        self.parent = "habitat"

        # TODO: I think these need to be defined here
        self.external_state_inputs = [
            "atmo_o2",
            "atmo_co2",
            "atmo_n2",
            "h2o_potb",
            "food_edbl"
            # TODO: Add temperature
        ]

        self.external_state_outputs = [
            "atmo_co2",
            "atmo_h2o",
            "h2o_urin",
            "h2o_wste"
        ]

        self.params = [
            ModelParam(
                key="atmo_o2_consumption",
                units="kg/hr",
                value=0.021583,
                source="simoc",
            ),
            ModelParam(
                key="h2o_consumption",
                units="kg/hr",
                value=0.165833,
                source="simoc",
            ),
            ModelParam(
                key="atmo_co2_output",
                units="kg/hr",
                value=0.025916,
                source="simoc",
            ),
            ModelParam(
                key="atmo_h2o_output",
                units="kg/hr",
                value=0.079167,
                source="simoc",
            ),
            ModelParam(
                key="h2o_urin",
                # What percent of this gets recycled?
                units="kg/hr",
                value=0.0625,
                source="simoc",
            ),
            ModelParam(
                key="solid_waste",
                units="kg/hr",
                value=0.087083,
                source="simoc",
            ),
            ModelParam(
                key="food_consumption",
                units="kg/hr",
                value=0.062917,
                source="simoc",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_water",
                units="hr",
                value=72,
                source="simoc",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="simoc",
            ),
            ModelParam(
                key="min_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=0.08,
                source="simoc",
            ),
            ModelParam(
                key="max_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=0.25,
                source="simoc",
            ),
            ModelParam(
                key="max_survivable_percent_atmo_co2",
                units="decimal_percent",
                value=0.01,
                source="simoc",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="simoc",
            )
        ]

        self.states = [
            ModelState(
                key="is_alive",
                units="boolean",
                value=1
            ),
            ModelState(
                key="hours_without_food",
                units="hours",
                value=0
            ),
            ModelState(
                key="hours_without_water",
                units="hours",
                value=0
            )
        ]


    def run_step(self, inputs, outputs, params, states):
        # Dead humans don't do anything. Convert to food if canibal=True lol?!?
        if states.is_alive == 0:
            print('dead')
            return

        # TODO: Make constraint checks abstracted
        if states.hours_without_water > params.max_hrs_survivable_with_no_water:
            # TODO: Support logging
            # self.log("died from lack of water")
            print('died due to lack of water')
            states.is_alive = 0
            return

        if states.hours_without_food > params.max_hrs_survivable_with_no_food:
            states.is_alive = 0
            print('died due to lack of food')
            return

        atmosphere_total = inputs.atmo_o2 + inputs.atmo_co2 + inputs.atmo_n2
        o2_concentration = inputs.atmo_o2 / atmosphere_total 
        if inputs.atmo_o2 == 0:
            states.is_alive = 0
            print('died due to no o2')
            return

        if o2_concentration < params.min_survivable_percent_atmo_o2:
            states.is_alive = 0
            print('died due to min_survivable_percent_atmo_o2')
            return

        if o2_concentration > params.max_survivable_percent_atmo_o2:
            states.is_alive = 0
            print('died due to min_survivable_percent_atmo_o2')
            return
        co2_concentration = inputs.atmo_co2 / atmosphere_total 
        if co2_concentration > params.max_survivable_percent_atmo_co2:
            states.is_alive = 0
            print('died due to too much co2')
            return

        if inputs.food_edbl == 0:
            states.hours_without_food += 1
        inputs.food_edbl -= min(params.food_consumption, inputs.food_edbl)

        if inputs.h2o_potb == 0:
            states.hours_without_water += 1
        inputs.h2o_potb -= min(params.h2o_consumption, inputs.h2o_potb)

        inputs.atmo_o2 -= min(params.atmo_o2_consumption, inputs.atmo_o2)
        outputs.atmo_co2 += params.atmo_co2_output
        outputs.atmo_h2o += params.atmo_h2o_output
        outputs.h2o_urin += params.h2o_urin
        outputs.solid_waste += params.solid_waste

class SolidWasteAerobicBioReactor(Model):
    def setup(self):
        self.name = "solid_waste_aerobic_bioreactor"
        self.parent = "location"
        self.description = """
            First stage recovery of wastewater,
            using microbial degradation.
            Isolates nutrients from urine."""


class DayNightPlant(Model):
    def setup(self):
        # TODO: Support this heirarchy
        # self.belongs_to = ["habitat", "mars"]
        self.name = "plant"
        self.parent = "location"

        # TODO: Auto-generate these connections
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
                key="day_time_co2_input",
                label="Day Time CO2 Consumption",
                description="This is the amount of CO2 consumped",
                units="kg/hr",
                minimum=0,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="day_time_o2_output",
                label="Day Time O2 Output",
                description="This is the amount of O2 output during the day",
                units="kg/hr",
                minimum=0,
                maximum=10,
                source="https://www.google.com",
                required=False
            ),
            ModelParam(
                key="night_time_co2_output",
                label="Night Time CO2 Output",
                description="This is the amount of O2 output at night",
                units="kg/hr",
                minimum=0,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="night_time_o2_input",
                label="Night Time O2 Input",
                description="This is the amount of O2 input at night day",
                units="kg/hr",
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
            models.habitat_atmosphere.co2 -= params.day_time_co2_input
            models.habitat_atmosphere.o2 += params.day_time_o2_output
        else:
            models.habitat_atmosphere.co2 += params.night_time_co2_output
            models.habitat_atmosphere.o2 -= params.night_time_o2_input

        states.mass += 1

        # TODO: Record changes. Ex: co2 production


# TODO: Converter from csv to models
class Raddish(DayNightPlant):
    def setup(self):
        # TODO: Avoid needing to do this super stuff.
        # Somehow have automatic inheretance
        super().setup()
        self.name = "Raddish"
        self.description = "A Raddish type plant"
        self.params = [
            ModelParam(
                key="day_time_co2_input",
                label="Day Time CO2 Consumption",
                description="This is the amount of CO2 consumped",
                units="kg/hr",
                minimum=0,
                value=10,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="day_time_o2_output",
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
                key="night_time_co2_output",
                label="Night Time CO2 Output",
                description="This is the amount of O2 output at night",
                units="kg/hr",
                value=5,
                minimum=0,
                maximum=10,
                notes="not sure about this",
                required=True
            ),
            ModelParam(
                key="night_time_o2_input",
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
        # self.inputs, self.outputs, self.states, run_step inhereted


class Location(Model):
    def setup(self):
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

def all_models():
    return [
        PotableWaterStorage(),
        FoodStorage(), HabitatAtmosphere(),
        Human(), Raddish(), Location()
    ]
    