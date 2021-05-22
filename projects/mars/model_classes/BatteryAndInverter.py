class BatteryAndInverter:
    name = "battery"
    params = [
        {
            "key": "capacity_dc_kwh",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 4000,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "capacity_dc_kw",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 4000,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "roundtrip_efficiency",
            "label": "",
            "units": "decimal percent",
            "private": False,
            "value": 0.95,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "wh_per_kg",
            "label": "",
            "units": "Wh/kg",
            "private": False,
            "value": 200,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "m3_per_kwh",
            "label": "",
            "units": "m3/kWh",
            "private": False,
            "value": 0.0001,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        }
    ]
    states = [
        {
            "key": "available_dc_kwh",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 4000,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "generated_dc_kwh",
            "label": "",
            "units": "kwh",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "The is the way that generators send kwh to battery",
            "source": ""
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):


        if states.mass == 0:
            inverter_mass = 0 # TODO: Incorporate inverter mass
            states.mass = 1 / ( params.wh_per_kg / 1000) * params.capacity_dc_kwh + inverter_mass
            states.volume = params.m3_per_kwh * params.capacity_dc_kwh

        if states.available_dc_kwh < 0:
            utils.terminate_sim_with_error("available_dc_kwh was negative")

        if states.available_dc_kwh == 0:
            utils.log_warning("Available AC kWh is zero!")

        # Due to current limitations in modeling setup
        # Apply the full round trip battery efficiency for
        # energy added to the battery instead of part when added in
        # and part when added out
        states.available_dc_kwh += states.generated_dc_kwh * params.roundtrip_efficiency

        # TODO: Check whether this shoudl be ac or dc
        if states.available_dc_kwh > params.capacity_dc_kwh:
            states.available_dc_kwh = params.capacity_dc_kwh

        # Reset the input DC bus so PV etc can be added in next sim tick
        states.generated_dc_kwh = 0

        # Hack for clipping by max available power
        states.available_dc_kwh = min(states.available_dc_kwh, params.capacity_dc_kw)
