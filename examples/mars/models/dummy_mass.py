
class DummyMass:
    name = "Dummy Mass"
    description = "Dummy mass used for testing"
    params = [
        dict(
            key="mass",
            units="kg",
            value=100000000,
            source="fake",
        ),
        dict(
            key="volume",
            units="m3",
            value=100000000,
            source="fake",
        )
    ]

    states = []

    @staticmethod
    def run_step(io, params, states, data, utils):
        pass