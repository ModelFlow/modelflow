
class Human:
    name = "human"
    params = [
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
        ),
        dict(
            key="mass",
            description="average mass",
            units="kg",
            value=68,
            source="google",
        ),
        dict(
            key="volume",
            description="average volume",
            units="m3",
            value=2,
            source="google",
        )
    ]

    private_states = [
        dict(
            key="activity_state",
            units='enum',
            value='TODO'
        ),
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

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        # TODO: Look at partial pressures of oxygen, not just percent concentration!!!

        if private_states.is_alive == 0:
            return

        if private_states.hours_without_water > params.max_hrs_survivable_with_no_water:
            private_states.is_alive = 0
            utils.log_event('died due to lack of water')
            return

        if private_states.hours_without_food > params.max_hrs_survivable_with_no_food:
            private_states.is_alive = 0
            utils.log_event('died due to lack of food')
            return

        atmosphere_total = shared_states.atmo_o2 + shared_states.atmo_co2 + shared_states.atmo_n2
        o2_concentration = shared_states.atmo_o2 / atmosphere_total
        if shared_states.atmo_o2 == 0:
            private_states.is_alive = 0
            utils.log_event('died due to no o2')
            return

        if o2_concentration < params.min_survivable_percent_atmo_o2:
            private_states.is_alive = 0
            print('died due to min_survivable_percent_atmo_o2')
            return

        # NOTE: You won't actually die from 100% O2 but makes eventual fire almost certain
        if o2_concentration > params.max_survivable_percent_atmo_o2:
            private_states.is_alive = 0
            utils.log_event('died due to likely fire from max_survivable_percent_atmo_o2')
            return
        co2_concentration = shared_states.atmo_co2 / atmosphere_total
        if co2_concentration > params.max_survivable_percent_atmo_co2:
            private_states.is_alive = 0
            utils.log_event('died due to too much co2')
            return

        if shared_states.atmo_temp > params.max_survivable_temperature:
            private_states.is_alive = 0
            utils.log_event('died due to too high temp')
            return

        if shared_states.atmo_temp < params.min_survivable_temperature:
            private_states.is_alive = 0
            utils.log_event('died due to too low temp')
            return

        if shared_states.food == 0:
            private_states.hours_without_food += 1
        shared_states.food -= min(params.food_consumption, shared_states.food)

        if shared_states.h2o_potb == 0:
            private_states.hours_without_water += 1
        shared_states.h2o_potb -= min(params.h2o_consumption, shared_states.h2o_potb)
        shared_states.atmo_o2 -= min(params.atmo_o2_consumption, shared_states.atmo_o2)
        shared_states.atmo_co2 += params.atmo_co2_output
        shared_states.atmo_h2o += params.atmo_h2o_output
        shared_states.h2o_urin += params.h2o_urin
        shared_states.h2o_waste += params.h2o_waste
        shared_states.heat_diff_kwh += params.heat_output_kwh
