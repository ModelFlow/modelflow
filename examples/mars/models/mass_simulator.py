
class MassSimulator:
    name = "Mass Simulator"
    description = "Dummy mass used for testing"
    private_states = [
        dict(
            key="mass",
            units="kg",
            value=100000000,
            source="fake",
            private=True,
        ),
        dict(
            key="volume",
            units="m3",
            value=100000000,
            source="fake",
            private=True,
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        pass