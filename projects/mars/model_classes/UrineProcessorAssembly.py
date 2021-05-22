class UrineProcessorAssembly:
    name = "Urine Processor Assembly"
    params = [
        {
            "key": "max_urine_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.375,
            "confidence": 0,
            "notes": "9 kg/day / 24 per wikipedia",
            "source": "https://en.wikipedia.org/wiki/ISS_ECLSS"
        },
        {
            "key": "min_urine_consumed_per_hour",
            "label": "",
            "units": "kg/hr",
            "private": False,
            "value": 0.1,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "dc_kwh_consumed_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 1.501,
            "confidence": 0,
            "notes": "TODO: Should be per kg input",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "efficiency",
            "label": "",
            "units": "decimal %",
            "private": False,
            "value": 0.85,
            "confidence": 0,
            "notes": "Not sure if this is accurate",
            "source": "https://en.wikipedia.org/wiki/ISS_ECLSS"
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

        if states.urine < params.min_urine_consumed_per_hour:
            return
        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        urine_processed = min(states.urine, params.max_urine_consumed_per_hour)
        states.urine -= urine_processed
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        states.unfiltered_water += urine_processed
