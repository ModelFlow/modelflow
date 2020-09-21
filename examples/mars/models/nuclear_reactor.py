class NuclearReactor:
    definition = {
        # TODO: Think of naming like kilopower instead
        "name": "nuclear_reactor",
        "scale_max": 10,
        "params": [
            dict(
                key="max_kw_ac",
                units="kw",
                value=40,
                source="FAKE"
            ),
            dict(
                key="mass",
                units="kg",
                value=1500,
                source="https://en.wikipedia.org/wiki/Kilopower",
                notes="The space rated 10 kWe Kilopower for Mars is expected to mass 1500 kg in total (with a 226 kg core) and contain 43.7 kg of U235"
            )
        ],
        "states": [],
        "linked_output_states": [
            "kwh_for_battery"
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass


    @staticmethod
    def run_step(io, params, states, data):
        io.kwh_for_battery = params.max_kw_ac
