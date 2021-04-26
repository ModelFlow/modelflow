class HydrolysisSystem:
    name = "Hydrolysis System"
    params = [
        {
            "key": "potable_water_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.413,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "dc_kwh_consumed_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0.959,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_h2_output_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.0454,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "atmo_o2_output_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.367,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "run_below_atmo_o2_ratio",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.195,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
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
        o2_ratio = states.atmo_o2 / float(total_atmosphere)
        if o2_ratio >= params.run_below_atmo_o2_ratio:
            return

        if states.potable_water < params.potable_water_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.potable_water -= min(states.potable_water, params.potable_water_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        # states.atmo_h2 += params.atmo_h2_output_per_hour
        states.atmo_o2 += params.atmo_o2_output_per_hour
