
class StarshipRadiators:
    # Ensure that this runs before anything else
    run_priority = 0
    name = "Starship Integrated Radiators"
    description = "Radiators attached to starship for the purpose of rejecting heat"
    params = [
        dict(
            key="deep_space_max_heat_rejection_kw",
            units="kw",
            value=200,
            source="fake"
        ),
        dict(
            key="mars_max_heat_rejection_kw",
            units="kw",
            value=100,
            source="fake"
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.heat_diff_kwh += params.deep_space_max_heat_rejection_kw
