class SabatierReactor:
    name = "Sabatier Reactor"
    params = [
        {
            "key": "atmo_h2_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.00163,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "dc_kwh_consumed_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0.291,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_co2_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.006534,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_ch4_output_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.0025,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "solid_waste_output_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.00567,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "run_above_co2_ppm",
            "label": "",
            "units": "ppm",
            "private": False,
            "value": 1000,
            "confidence": 0,
            "notes": "",
            "source": "https://www.epa.gov/sites/production/files/2014-08/documents/appena.pdf"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 193.3,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0.39,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):


        total_atmosphere = states.atmo_o2 + states.atmo_n2 + states.atmo_co2
        co2_ratio = states.atmo_co2 / float(total_atmosphere)
        if co2_ratio <= params.run_above_co2_ppm:
            return

        if states.atmo_h2 < params.atmo_h2_consumed_per_hour:
            return

        if states.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.atmo_h2 -= min(states.atmo_h2, params.potable_water_consumed_per_hour)
        states.atmo_co2 -= min(states.atmo_co2, params.atmo_co2_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        states.atmo_ch4 += params.atmo_ch4_output_per_hour
        states.solid_waste += params.solid_waste_output_per_hour
