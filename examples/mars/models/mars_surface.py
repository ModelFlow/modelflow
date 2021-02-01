
class MarsSurface:

    name = "Mars Surface"
    description = "This handles accepting power from pv generation and distribution at the moment"
    params = []

    states = [
        dict(
            key="atmospheric_co2",
            label="Atmospheric CO2",
            value=999999999,
            units="kg",
            source='fake'
        ),
        dict(
            key="temperature",
            label="Temperature",
            value=0,
            units="c",
            source='fake'
        ),

    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        # TODO: Have temperature change with time
        pass