class Heater:
    name = "heater"
    params = [
        {
            "key": "max_kw_output",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 10,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        },
        {
            "key": "min_kw_output",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 0.5,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        },
        {
            "key": "target_temp",
            "label": "",
            "units": "degrees c",
            "private": False,
            "value": 20,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        },
        {
            "key": "temp_dead_band",
            "label": "",
            "units": "degrees c",
            "private": False,
            "value": 0.3,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 20,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):

        # Dumb heater
        # max power if below deadband

        # Smart heater
        # Calculate what KW would be needed to raise
        # temperature between current temp and target temp

        # Don't run if within deadband of target temp or above

        if states.atmo_temp < params.target_temp - params.temp_dead_band:
            # TODO: Replace with a smart heating strategy
            states.heat_diff_kwh += params.min_kw_output
