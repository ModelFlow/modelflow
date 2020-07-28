from modelflow.modelflow import Model, ModelParam, ModelState


class HabitatStructure(Model):
    def setup(self):
        self.name = "human"
        self.parent = "habitat"

        # TODO: I think these need to be defined here
        self.linked_input_states = [
            "atmo_co2",
            "atmo_o2",
            "atmo_n2",
            "atmo_ch4",
            "atmo_h2",
            # "atmo_temp". # Could eventually depend on atmo_temp to determine heat loss
        ]
 
        self.linked_output_states = [
            "atmo_co2",
            "atmo_o2",
            "atmo_n2",
            "atmo_ch4",
            "atmo_h2",
            "heat_diff_kwh"
        ]

        # TODO:
        # - Improvements could be made to different heat fluxes during different times of day

        # Support depressurization events

        self.params = [
            ModelParam(
                key="leak_rate",
                description="Note: there was also some mars one paragon report on this",
                units="decimal percent of atm / hr", # Note: Maybe there can be a warning on non standard units
                value=0.0001,
                source="FAKE. But could look at https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20110012997.pdf",
            ),
            ModelParam(
                key="heat_loss_per_hour",
                units="kwh",
                value=0.25,
                source="FAKE",
            )
        ]

        # TODO: Maybe should be door, but every EVA you can have air loss
        # Can have random leak events
        self.states = []

    def run_step(self, inputs, outputs, params, states):
        for atmo_key in ["atmo_co2", "atmo_o2", "atmo_n2","atmo_ch4","atmo_h2"]:
            atmo_input = getattr(inputs, atmo_key)
            atmo_output = atmo_input - atmo_input * params.leak_rate
            setattr(outputs, atmo_key, atmo_output)

        outputs.heat_diff_kwh -= params.heat_loss_per_hour
