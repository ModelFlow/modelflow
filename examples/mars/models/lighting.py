class Lighting:
    definition = {
        "name": "lighting",
        "params": [
            dict(
                key="enrg_kwh_use",
                units="kwh",
                value=10,
                source="FAKE"
            )
        ],
        "states": [],
        "linked_input_states": [
            "enrg_kwh"
        ]
    }

    @staticmethod
    def cost(params, states):
        return 1

    @staticmethod
    def run_step(io, params, states, data):
        io.enrg_kwh -= min(params.enrg_kwh_use, io.enrg_kwh)
