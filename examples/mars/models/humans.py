
class Human:
    definition = {
        "name": "human",
        "parent": "habitat",
        "linked_input_states": [
            "atmo_o2",
            "atmo_co2",
            "atmo_n2",
            "h2o_potb",
            "food_edbl"
        ],
        "linked_output_states": [
            "atmo_co2",
            "atmo_h2o",
            "h2o_urin",
            "h2o_waste",
            "heat_diff_kwh"
        ],
        "params": [
            dict(
                key="atmo_o2_consumption",
                units="kg/hr",
                value=0.021583,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_consumption",
                units="kg/hr",
                value=0.165833,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_co2_output",
                units="kg/hr",
                value=0.025916,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="atmo_h2o_output",
                units="kg/hr",
                value=0.079167,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_urin",
                units="kg/hr",
                value=0.0625,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="h2o_waste",
                units="kg/hr",
                value=0.087083,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="food_consumption",
                units="kg/hr",
                value=0.062917,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="max_hrs_survivable_with_no_water",
                units="hr",
                value=72,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="min_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=0.08,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="max_survivable_percent_atmo_o2",
                units="decimal_percent",
                value=1,
                source="https://www.nasa.gov/pdf/188963main_Extravehicular_Mobility_Unit.pdf",
            ),
            dict(
                key="max_survivable_percent_atmo_co2",
                units="decimal_percent",
                value=0.01,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="max_hrs_survivable_with_no_food",
                units="hr",
                value=480,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ),
            dict(
                key="max_survivable_temperature",
                units="C",
                value=48,
                source="google",
            ),
            dict(
                key="min_survivable_temperature",
                description="While obviously below 0C is survivable, if the habitat interior freezes, you're probably a gonner",
                units="C",
                value=0,
                source="google",
            ),
            dict(
                key="heat_output_kwh",
                description="Heating io of humans",
                units="kwh",
                value=0.1,
                source="google",
            )
        ],
        "states": [
            dict(
                key="is_alive",
                units="boolean",
                value=1
            ),
            dict(
                key="hours_without_food",
                units="hours",
                value=0
            ),
            dict(
                key="hours_without_water",
                units="hours",
                value=0
            )
        ]
    }

    @staticmethod
    def run_step(io, params, states, data):
        # TODO: Look at partial pressures of oxygen, not just percent concentration!!!

        if states.is_alive == 0:
            # Note: We do this because just using a try catch is expensive in C
            states.terminate_sim = 1
            return

        if states.hours_without_water > params.max_hrs_survivable_with_no_water:
            # TODO: Support formal logging events
            # "log("died from lack of water")
            print('died due to lack of water')
            states.is_alive = 0
            return

        if states.hours_without_food > params.max_hrs_survivable_with_no_food:
            states.is_alive = 0
            print('died due to lack of food')
            return

        atmosphere_total = io.atmo_o2 + io.atmo_co2 + io.atmo_n2
        o2_concentration = io.atmo_o2 / atmosphere_total
        if io.atmo_o2 == 0:
            states.is_alive = 0
            print('died due to no o2')
            return

        if o2_concentration < params.min_survivable_percent_atmo_o2:
            states.is_alive = 0
            print('died due to min_survivable_percent_atmo_o2')
            return

        if o2_concentration > params.max_survivable_percent_atmo_o2:
            states.is_alive = 0
            # TODO: Support print statement logging
            print('died due to max_survivable_percent_atmo_o2')
            return
        co2_concentration = io.atmo_co2 / atmosphere_total
        if co2_concentration > params.max_survivable_percent_atmo_co2:
            states.is_alive = 0
            print('died due to too much co2')
            return

        if io.atmo_temp > params.max_survivable_temperature:
            states.is_alive = 0
            print('died due to too high temp')
            return

        if io.atmo_temp < params.min_survivable_temperature:
            states.is_alive = 0
            print('died due to too low temp')
            return

        if io.food_edbl == 0:
            states.hours_without_food += 1
        io.food_edbl -= min(params.food_consumption, io.food_edbl)

        if io.h2o_potb == 0:
            states.hours_without_water += 1
        io.h2o_potb -= min(params.h2o_consumption, io.h2o_potb)
        io.atmo_o2 -= min(params.atmo_o2_consumption, io.atmo_o2)
        io.atmo_co2 += params.atmo_co2_output
        io.atmo_h2o += params.atmo_h2o_output
        io.h2o_urin += params.h2o_urin
        io.h2o_waste += params.h2o_waste
        io.heat_diff_kwh += params.heat_output_kwh
