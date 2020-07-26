from modelflow.modelflow import Model, ModelParam, ModelState


class PVInverter(Model):
    def setup(self):
        # Want some naming indication that this is a
        # solar array from data.
        self.name = "pv_inverter"

        # TODO: Handle potential times scaling issues

        # Note: You could have efficiency curves in here
        self.params = [
            ModelParam(
                key="max_kw_ac",
                units="kw", # (Doesn't matter if kwh since hour hard coded currently)
                value=50,
                source="FAKE"
            ),
            ModelParam(
                key="one_way_efficiency",
                units="decimal percent", # (Doesn't matter if kwh since hour hard coded currently)
                value=0.98,
                source="FAKE"
            )
        ]

        self.states = [
            ModelState(
                # Note: This should probably be a global var
                # currently used to index into csv for power gen
                key="time_since_start",
                units="hours",
                value=0
            )
        ]

        self.linked_input_states = [
            "dc_kwh"
        ]

        self.linked_output_states = [
            "kwh_for_battery"
        ]

    def run_step(self, inputs, outputs, params, states):
        if inputs.dc_kwh < 0:
            raise Exception("negative power input to inverter. Makes no sense")

        outputs.kwh_for_battery = min(inputs.dc_kwh * params.one_way_efficiency, params.max_kw_ac)
