class Lighting:
    name="lighting"
    params=[
        dict(
            key="enrg_kwh_use",
            units="kwh",
            value=10,
            source="FAKE"
        ),
        dict(
            key="mass",
            units="kg",
            value=1,
            source="FAKE"
        ),
        dict(
            key="volume",
            units="kg",
            value=1,
            source="FAKE"
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        shared_states.available_dc_kwh -= min(params.enrg_kwh_use, shared_states.available_dc_kwh)
