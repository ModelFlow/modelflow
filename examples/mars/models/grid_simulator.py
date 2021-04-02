
class GridSimulator:
    name = "Grid Simulator"
    description = "Uses all available energy"
    states = [
        dict(
            key="mass",
            units="kg",
            value=1,
            source="fake",
            private=True,
        ),
        dict(
            key="volume",
            units="m3",
            value=1,
            source="fake",
            private=True,
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.available_dc_kwh = 0
