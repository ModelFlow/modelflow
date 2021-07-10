class IndoorAir:
    name = "IndoorAir"
    params = [
        {
            "key": "specific_heat_of_air",
            "label": "",
            "units": "KJ/kgC",
            "private": False,
            "value": 1.05,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    states = [
        {
            "key": "atmo_n2",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 1008.84528,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "atmo_o2",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 270.62232,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "atmo_co2",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0.5168,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "atmo_h2o",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 10.38,
            "confidence": 0,
            "notes": ".6 (Relative Humidity) * 17.3 (saturation vapor density g/m3) / 1000 3/kg * 1000 m3 vol",
            "source": ""
        },
        {
            "key": "atmo_ch4",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "heat_diff_kwh",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "atmo_temp",
            "label": "",
            "units": "c",
            "private": False,
            "value": 20,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
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
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "google"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        },
        {
            "key": "atmo_volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 1000,
            "confidence": 0,
            "notes": "",
            "source": "fake derating of the 1,100 from starship"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        # TODO: Create a more accurate model that varies specific heat of air based on temperature, moisture
        mass_of_air = states.atmo_co2 + states.atmo_o2 + states.atmo_n2 + states.atmo_ch4
        KJ_required_to_heat_1_deg_c = mass_of_air * params.specific_heat_of_air
        kwh_required_to_heat_1_deg_c = KJ_required_to_heat_1_deg_c / 3600
        temp_diff = kwh_required_to_heat_1_deg_c * states.heat_diff_kwh
        states.atmo_temp += temp_diff
        states.heat_diff_kwh = 0 # Reset this every step

        max_val = 10000
        if states.atmo_o2 > max_val:
            states.atmo_o2 = max_val
        if states.atmo_co2 > max_val:
            states.atmo_co2 = max_val        
        if states.atmo_n2 > max_val:
            states.atmo_n2 = max_val        
        if states.atmo_h2o > max_val:
            states.atmo_h2o = max_val        
        if states.atmo_ch4 > max_val:
            states.atmo_ch4 = max_val

        if states.atmo_o2 < 0:
            states.atmo_o2 = 0
        if states.atmo_co2 < 0:
            states.atmo_co2 = 0        
        if states.atmo_n2 < 0:
            states.atmo_n2 = 0        
        if states.atmo_h2o < 0:
            states.atmo_h2o = 0        
        if states.atmo_ch4 < 0:
            states.atmo_ch4 = 0

        states.mass = states.atmo_n2 + states.atmo_o2 + states.atmo_co2 + states.atmo_ch4
