
class StarshipBattery:

    # Ensure that this runs before anything else
    # NOTE: Perhaps insted we could have some dependency graph like batteries first depend on pv being calculated etc
    run_priority = 1

    name = "Starship Battery"
    description = "This handles accepting power from pv generation and distribution at the moment"
    params = [
        dict(
            key="max_kw_output",
            description="NOTE: THIS IS A SUPER ROUGH PLACEHOLDER VALUE. Replace with actual model + inverter",
            units="m3",
            value=200,
            source="google",
        )
    ]

    states = [
        dict(
            key="ac_energy_kwh",
            label="Available AC Energy kWh",
            value=200,
            units="kWh",
            source='fake'
        ),
    ]

    @staticmethod
    def run_step(io, params, states, data, utils):
        # NOTE: This is bad and makes assumption each timestep is one hour
        # NOTE: It is also kinda weird that we're making every component that use
        # electricity first check whether ther is enough energy available before running
        states.available_ac_energy_kwh = io.pv_kw_output