
class StarshipPV:
    # Ensure that this runs before anything else
    run_priority = 0
    name = "Starship Solar Panels"
    description = "Note: this container assumes that every child object has a mass and volume parameter or state"
    params = [
        dict(
            key="rated_pv_kw_output",
            description="NOTE: THIS IS A SUPER ROUGH PLACEHOLDER VALUE. Replace with actual model + inverter",
            units="m3",
            value=200,
            source="google",
        )
    ]

    states = [
        dict(
            key="pv_kw_output",
            label="PV kW Output",
            value=200,
            units="kW",
            source='fake'
        ),
    ]

    @staticmethod
    def run_step(io, params, states, data, utils):
        states.pv_kw_output = params.rated_pv_kw_output