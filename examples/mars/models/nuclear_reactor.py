from modelflow.modelflow import Model, ModelParam


class NuclearReactor(Model):
    def setup(self):
        # TODO: Think of naming like kilopower instead
        self.name = "nuclear_reactor"

        self.params = [
            ModelParam(
                key="max_kw_ac",
                units="kw", # (Doesn't matter if kwh since hour hard coded currently)
                value=40,
                source="FAKE"
            )
        ]

        self.states = [
        ]


        self.linked_output_states = [
            "kwh_for_battery"
        ]

    def run_step(self, inputs, outputs, params, states):
        outputs.kwh_for_battery = params.max_kw_ac
