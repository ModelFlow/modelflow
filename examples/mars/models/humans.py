from modelflow.modelflow import Model, ModelParam, ModelState


class Human(Model):
    def setup(self):
        self.name = "human"
        self.parent = "habitat"

        # TODO: I think these need to be defined here
        self.linked_input_states = [
            "atmo_o2",
            "atmo_co2",
            "atmo_n2",
            "h2o_potb",
            "food_edbl"
            # TODO: Add temperature
        ]

        self.linked_output_states = [
            "atmo_co2",
            "atmo_h2o",
            "h2o_urin",
            "h2o_waste",
            "heat_diff_kwh"
        ]

        # Note: some these constraints may be pulled out

        self.params = [
            ModelParam(
                key="atmo_o2_consumption",
                units="kg/hr",
                value=0.021583,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_consumption",
                units="kg/hr",
                value=0.165833,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_co2_output",
                units="kg/hr",
                value=0.025916,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="atmo_h2o_output",
                units="kg/hr",
                value=0.079167,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_urin",
                units="kg/hr",
                value=0.0625,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="h2o_waste",
                units="kg/hr",
                value=0.087083,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="food_consumption",
                units="kg/hr",
                value=0.062917,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_water",
                units="hr",
                value=72,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="min_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=0.08,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=0.25,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_survivable_percent_atmo_co2",
                units="decimal_percent",
                value=0.01,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            ModelParam(
                key="max_survivable_temperature",
                units="C",
                value=48,
                source="google",
            ),
            ModelParam(
                key="min_survivable_temperature",
                description="While obviously below 0C is survivable, if the habitat interior freezes, you're probably a gonner",
                units="C",
                value=0,
                source="google",
            ),
            ModelParam(
                key="heat_output_kwh",
                description="Heating outputs of humans",
                units="kwh",
                value=0.1,
                source="google",
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
            return

        # TODO: Make constraint checks abstracted
        if states.hours_without_water > params.max_hrs_survivable_with_no_water:
            # TODO: Support logging events
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

        if inputs.atmo_temp > params.max_survivable_temperature:
            states.is_alive = 0
            print('died due to too high temp')
            return

        if inputs.atmo_temp < params.min_survivable_temperature:
            states.is_alive = 0
            print('died due to too low temp')
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
        outputs.h2o_waste += params.h2o_waste
        outputs.heat_diff_kwh += params.heat_output_kwh
