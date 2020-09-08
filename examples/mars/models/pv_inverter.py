class PVInverter:
    definition = {
        # Want some naming indication that this is a
        # solar array from data.
        "name": "pv_inverter",

        # TODO: Handle potential times scaling issues

        # Note: You could have efficiency curves in here
        "params": [
            dict(
                key="max_kw_ac",
                units="kw", # (Doesn't matter if kwh since hour hard coded currently)
                value=50,
                min=0,
                max=10000,
                source="FAKE"
            ),
            dict(
                key="one_way_efficiency",
                units="decimal percent", # (Doesn't matter if kwh since hour hard coded currently)
                value=0.98,
                source="FAKE"
            ),
            dict(
                key="mass",
                value=2.6,
                units="kg/kw",
                notes="""
                100kW: https://www.solaris-shop.com/solectria-pvi-100-240-100kw-inverter/
                10kW: https://zerohomebills.com/product/solax-x3-10-0-t-d-3ph-10kw-solar-inverter/
                """
            )
        ],
        "states": [
            # TODO: Come up with better way to store inputs/outputs
            dict(
                key="dc_kwh",
                units="kwh",
                value=0
            ),
            dict(
                # Note: This should probably be a global var
                # currently used to index into csv for power gen
                key="time_since_start",
                units="hours",
                value=0
            )
        ],
        "linked_input_states": [
            "dc_kwh"
        ],
        "linked_output_states": [
            "kwh_for_battery"
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass * params.max_kw_ac

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        if inputs.dc_kwh < 0:
            raise Exception("negative power input to inverter. Makes no sense")

        outputs.kwh_for_battery += min(inputs.dc_kwh * params.one_way_efficiency, params.max_kw_ac)
