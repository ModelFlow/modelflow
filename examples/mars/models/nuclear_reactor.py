class NuclearReactor:
    definition = {
        # TODO: Think of naming like kilopower instead
        "name": "nuclear_reactor",
        "scale_max": 10,
        "params": [
            dict(
                key="max_kw_ac",
                units="kwe",
                value=150,
                source="USNC-Tech"
            ),
            dict(
                key="mass",
                units="kg",
                value=4500,
                source="USNC-Tech",
               
            ),
            dict(
                key="lifespan",
                units="years",
                value=10,
                source="USNC-Tech",
               
            ),
            dict(
                key="heat production",
                units="kelvin",
                value=1150,
                source="USNC-Tech",
               
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
