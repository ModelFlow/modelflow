class WaterIceMiningMachine:
    name = "WaterIceMiningMachine"
    params = [
        {
            "key": "kwh_per_kg_h2o",
            "label": "",
            "units": "kWh/kg H2O",
            "private": False,
            "value": 7,
            "confidence": 0,
            "notes": "Sanders (2010)  says 6.6kWh/kg for 8% water in soil and 13.9 for 3% water. HabNet says 7 and 12.2. Values for ice deposits will probably be much lower",
            "source": ""
        },
        {
            "key": "max_production_kg_h2o_per_hr",
            "label": "",
            "units": "kg H2O/hr",
            "private": False,
            "value": 31.25,
            "confidence": 0,
            "notes": "This is the minimum to make fuel in required time. Should definitely be higher",
            "source": "habnet"
        },
        {
            "key": "mass_per_kg",
            "label": "",
            "units": "kg/kg H2O/hr",
            "private": False,
            "value": 103,
            "confidence": 0,
            "notes": "",
            "source": "https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf"
        },
        {
            "key": "volume_per_kg",
            "label": "",
            "units": "m3/kg H2O/hr",
            "private": False,
            "value": 0.38,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    states = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "calculated"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "calculated"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):
        states.mass = params.mass_per_kg * params.max_production_kg_h2o_per_hr
        states.volume = params.volume_per_kg * params.max_production_kg_h2o_per_hr

        states.isru_liquid_h2o += params.max_production_kg_h2o_per_hr
