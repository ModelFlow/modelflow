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
    def run_step(inputs, outputs, params, states, data):
        inputs.enrg_kwh -= min(params.enrg_kwh_use, inputs.enrg_kwh)
