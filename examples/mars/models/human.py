
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
            key="potable_water_consumption",
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
            key="urine_output",
            units="kg/hr",
            value=0.0625,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="solid_waste_output",
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

    states =[
        dict(
            key="activity_state",
            units='enum',
            value='TODO',
            private=True,
        ),
        dict(
            key="is_alive",
            units="boolean",
            value=1,
            private=True,
        ),
        dict(
            key="hours_without_food",
            units="hours",
            value=0,
            private=True,
        ),
        dict(
            key="hours_without_water",
            units="hours",
            value=0,
            private=True,
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        # TODO: Look at partial pressures of oxygen, not just percent concentration!!!

        if states.is_alive == 0:
            return

        if states.hours_without_water > params.max_hrs_survivable_with_no_water:
            states.is_alive = 0
            utils.log_event('died due to lack of water')
            return

        if states.hours_without_food > params.max_hrs_survivable_with_no_food:
            states.is_alive = 0
            utils.log_event('died due to lack of food')
            return

        atmosphere_total = states.atmo_o2 + states.atmo_co2 + states.atmo_n2
        o2_concentration = states.atmo_o2 / atmosphere_total
        if states.atmo_o2 == 0:
            states.is_alive = 0
            utils.log_event('died due to no o2')
            return

        if o2_concentration < params.min_survivable_percent_atmo_o2:
            states.is_alive = 0
            print('died due to min_survivable_percent_atmo_o2')
            return

        # NOTE: You won't actually die from 100% O2 but makes eventual fire almost certain
        if o2_concentration > params.max_survivable_percent_atmo_o2:
            states.is_alive = 0
            utils.log_event('died due to likely fire from max_survivable_percent_atmo_o2')
            return
        co2_concentration = states.atmo_co2 / atmosphere_total
        if co2_concentration > params.max_survivable_percent_atmo_co2:
            states.is_alive = 0
            utils.log_event('died due to too much co2')
            return

        if states.atmo_temp > params.max_survivable_temperature:
            states.is_alive = 0
            utils.log_event('died due to too high temp')
            return

        if states.atmo_temp < params.min_survivable_temperature:
            states.is_alive = 0
            utils.log_event('died due to too low temp')
            return

        if states.food == 0:
            states.hours_without_food += 1
        states.food -= min(params.food_consumption, states.food)

        if states.potable_water == 0:
            states.hours_without_water += 1
        states.potable_water -= min(params.potable_water_consumption, states.potable_water)
        states.atmo_o2 -= min(params.atmo_o2_consumption, states.atmo_o2)
        states.atmo_co2 += params.atmo_co2_output
        states.atmo_h2o += params.atmo_h2o_output
        states.urine += params.urine_output
        states.solid_waste += params.solid_waste_output
        states.heat_diff_kwh += params.heat_output_kwh
