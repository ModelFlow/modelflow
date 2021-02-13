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
                value=1800,
                source="https://ntrs.nasa.gov/api/citations/20160012354/downloads/20160012354.pdf",
                notes="The space rated 10 kWe Kilopower for Mars is expected to mass 1500 kg in total (with a 226 kg core) and contain 43.7 kg of U235"
            ),
            dict(
                key="lifespan",
                units="years",
                value=10,
                source="https://ntrs.nasa.gov/api/citations/20160012354/downloads/20160012354.pdf"
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
