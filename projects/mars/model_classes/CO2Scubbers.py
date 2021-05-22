class CO2Scubbers:
    name = "co2_scrubbers"
    params = [
        {
            "key": "atmo_co2_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "dc_kwh_consumed_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0.65,
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
            "value": 137.35,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0.31,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):
        # states.atmo_co2 = 0

        total_atmosphere = states.atmo_o2 + states.atmo_n2 + states.atmo_co2
        
        co2_ppm = (states.atmo_co2 / float(total_atmosphere)) * 1e6
        if co2_ppm < params.run_above_co2_ppm:
            return

        if states.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.atmo_co2 -= min(states.atmo_co2, params.atmo_co2_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)
