
class GridSimulator:
    name = "Grid Simulator"
    description = "Uses all available energy"
    private_states = [
        dict(
            key="mass",
            units="kg",
            value=1,
            source="fake",
        ),
        dict(
            key="volume",
            units="m3",
            value=1,
            source="fake",
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        shared_states.available_dc_kwh = 0
