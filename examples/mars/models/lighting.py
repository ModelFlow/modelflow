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
    def run_step(states, params, utils):

        states.available_dc_kwh -= min(params.enrg_kwh_use, states.available_dc_kwh)
