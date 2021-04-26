class StarshipRadiators:
    name = "Starship Integrated Radiators"
    params = [
        {
            "key": "deep_space_max_heat_rejection_kw",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 200,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "mars_max_heat_rejection_kw",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 100,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        },
        {
            "key": "radiator_start_setpoint",
            "label": "",
            "units": "degrees celsius",
            "private": False,
            "value": 20.5556,
            "confidence": 0,
            "notes": "",
            "source": "fake"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):
        if states.atmo_temp > params.radiator_start_setpoint:
            specific_heat_of_air = 1.05
            mass_of_air = states.atmo_co2 + states.atmo_o2 + states.atmo_n2 + states.atmo_ch4
            KJ_required_to_heat_1_deg_c = mass_of_air * specific_heat_of_air
            kwh_required_to_heat_1_deg_c = KJ_required_to_heat_1_deg_c / 3600
            cooling_needed = (states.atmo_temp - params.radiator_start_setpoint) * kwh_required_to_heat_1_deg_c
            needed_kwh_heat_rejection = max(states.heat_diff_kwh, 0) + cooling_needed
            if needed_kwh_heat_rejection > params.deep_space_max_heat_rejection_kw:
                states.heat_diff_kwh -= params.deep_space_max_heat_rejection_kw
            else:
                states.heat_diff_kwh = -1 * cooling_needed
