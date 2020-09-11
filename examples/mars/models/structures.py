class HabitatStructure:
    definition = {
        "name": "human",
        "parent": "habitat",

        # TODO: I think these need to be defined here
        "linked_input_states": [
            "atmo_co2",
            "atmo_o2",
            "atmo_n2",
            "atmo_ch4",
            "atmo_h2",
            # "atmo_temp". # Could eventually depend on atmo_temp to determine heat loss
        ],
        "linked_output_states": [
            "atmo_co2",
            "atmo_o2",
            "atmo_n2",
            "atmo_ch4",
            "atmo_h2",
            "heat_diff_kwh"
        ],

        # TODO:
        # - Improvements could be made to different heat fluxes during different times of day

        # Support depressurization events
        "params": [
            dict(
                key="leak_rate",
                description="Note: there was also some mars one paragon report on this",
                units="decimal percent of atm / hr", # Note: Maybe there can be a warning on non standard units
                value=0.0001,
                source="FAKE. But could look at https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20110012997.pdf",
            ),
            dict(
                key="heat_loss_per_hour",
                units="kwh",
                value=0.25,
                source="FAKE",
            )
        ],
        # TODO: Maybe should be door, but every EVA you can have air loss
        # Can have random leak events
        "states": []
    }

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        inputs.atmo_co2 -= inputs.atmo_co2 * params.leak_rate
        inputs.atmo_o2 -= inputs.atmo_o2 * params.leak_rate
        inputs.atmo_n2 -= inputs.atmo_n2 * params.leak_rate
        inputs.atmo_ch4 -= inputs.atmo_ch4 * params.leak_rate
        inputs.atmo_h2 -= inputs.atmo_h2 * params.leak_rate

        outputs.heat_diff_kwh -= params.heat_loss_per_hour
