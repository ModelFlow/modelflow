class Human:
    name = "human"
    params = [
        {
            "key": "atmo_o2_consumption",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.021583,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "potable_water_consumption",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.165833,
            "confidence": 0,
            "notes": "from SIMOC: 0.083333 kg/hr h2o_potb* 2.0 kg / day drink, plus (was 2.5 with food hydration) + 0.0825 kg/hr h2o_potb 1.98 kg / day hygiene + urine flush from Human Integration and Design handbook (2017)",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_co2_output",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.025916,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_h2o_output",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.079167,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "urine_output",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.0625,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "solid_waste_output",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.087083,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "food_consumption",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.07629166667,
            "confidence": 0,
            "notes": "",
            "source": "https://ntrs.nasa.gov/api/citations/20150003005/downloads/20150003005.pdf"
        },
        {
            "key": "max_hrs_survivable_with_no_water",
            "label": "",
            "units": "hr",
            "private": False,
            "value": 72,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "max_hrs_survivable_with_no_food",
            "label": "",
            "units": "hr",
            "private": False,
            "value": 480,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "min_survivable_percent_atmo_o2",
            "label": "",
            "units": "decimal_percent",
            "private": False,
            "value": 0.08,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "max_survivable_percent_atmo_o2",
            "label": "",
            "units": "decimal_percent",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/188963main_Extravehicular_Mobility_Unit.pdf"
        },
        {
            "key": "max_survivable_co2_ppm",
            "label": "",
            "units": "ppm",
            "private": False,
            "value": 40000,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "max_survivable_temperature",
            "label": "",
            "units": "C",
            "private": False,
            "value": 48,
            "confidence": 0,
            "notes": "",
            "source": "google"
        },
        {
            "key": "min_survivable_temperature",
            "label": "",
            "units": "C",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "google"
        },
        {
            "key": "heat_output_kwh",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0.1,
            "confidence": 0,
            "notes": "",
            "source": "google"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 68,
            "confidence": 0,
            "notes": "",
            "source": "google"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 2,
            "confidence": 0,
            "notes": "",
            "source": "google"
        }
    ]
    states = [
        {
            "key": "activity_state",
            "label": "",
            "units": "enum",
            "private": True,
            "value": "TODO",
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "is_alive",
            "label": "",
            "units": "boolean",
            "private": True,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "hours_without_food",
            "label": "",
            "units": "hours",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "hours_without_water",
            "label": "",
            "units": "hours",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        # TODO: Look at partial pressures of oxygen, not just percent concentration!!!

        if states.is_alive == 0:
            return

        if states.hours_without_water > params.max_hrs_survivable_with_no_water:
            states.is_alive = 0
            # Note: Currently any human death is a fatal sim error
            # utils.log_event('died due to lack of water')
            utils.terminate_sim_with_error('died due to lack of water')

            return

        if states.hours_without_food > params.max_hrs_survivable_with_no_food:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to lack of food')
            return

        atmosphere_total = states.atmo_o2 + states.atmo_co2 + states.atmo_n2
        o2_concentration = states.atmo_o2 / atmosphere_total
        if states.atmo_o2 == 0:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to no o2')
            return

        if o2_concentration < params.min_survivable_percent_atmo_o2:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to min o2')
            return

        # NOTE: You won't actually die from 100% O2 but makes eventual fire almost certain
        if o2_concentration > params.max_survivable_percent_atmo_o2:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to likely fire from max_survivable_percent_atmo_o2')
            return
        co2_ppm = states.atmo_co2 / atmosphere_total * 1e6
        if co2_ppm > params.max_survivable_co2_ppm:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to too much co2')
            return

        if states.atmo_temp > params.max_survivable_temperature:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to too high temp')
            return

        if states.atmo_temp < params.min_survivable_temperature:
            states.is_alive = 0
            utils.terminate_sim_with_error('died due to too low temp')
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
