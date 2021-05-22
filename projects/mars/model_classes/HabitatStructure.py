class HabitatStructure:
    name = "HabitatStructure"
    params = [
        {
            "key": "leak_rate",
            "label": "",
            "units": "decimal percent of atm / hr",
            "private": False,
            "value": 0.0001,
            "confidence": 0,
            "notes": "",
            "source": "FAKE. But could look at https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20110012997.pdf"
        },
        {
            "key": "heat_loss_per_hour",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0.25,
            "confidence": 0,
            "notes": "Improvements could be made to different heat fluxes during different times of day",
            "source": "FAKE"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):

        states.atmo_co2 -= states.atmo_co2 * params.leak_rate
        states.atmo_o2 -= states.atmo_o2 * params.leak_rate
        states.atmo_n2 -= states.atmo_n2 * params.leak_rate
        states.atmo_ch4 -= states.atmo_ch4 * params.leak_rate

        states.heat_diff_kwh -= params.heat_loss_per_hour
