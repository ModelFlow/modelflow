class WaterProcessorAssembly:
    name = "Water Processor Assembly"
    params = [
        {
            "key": "max_h2o_tret_processed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 5.8967,
            "confidence": 0,
            "notes": "Comes from 13 lb/hr in source. I'm not sure if this is correct.",
            "source": "https://ntrs.nasa.gov/api/citations/20050207388/downloads/20050207388.pdf"
        },
        {
            "key": "dc_kwh_consumed_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 1.501,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 114.6,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0.11,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):

        if states.unfiltered_water < params.max_h2o_tret_processed_per_hour:
            return
        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        processed = min(states.unfiltered_water, params.max_h2o_tret_processed_per_hour)
        states.unfiltered_water -= processed
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)
        states.potable_water += processed
