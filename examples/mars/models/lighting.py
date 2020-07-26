from modelflow.modelflow import Model, ModelParam, ModelState


class Lighting(Model):
    def setup(self):
        # Super simple load source
        self.name = "lighting"

        self.params = [
            ModelParam(
                key="enrg_kwh_use",
                units="kwh",
                value=10,
                source="FAKE"
            )
        ]

        self.states = [
            # Perhaps modulate light at night etc
        ]

        self.linked_input_states = [
            "enrg_kwh"
        ]

    def run_step(self, inputs, outputs, params, states):
        inputs.enrg_kwh -= min(params.enrg_kwh_use, inputs.enrg_kwh)
