 class DayNightPlant(Model):
        def setup(self):
            # TODO: Support this heirarchy
            # self.belongs_to = ["habitat", "mars"]
            self.name = "plant"
            self.parent = "location"

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
