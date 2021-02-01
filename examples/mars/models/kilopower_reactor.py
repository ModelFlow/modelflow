class KilopowerReactor:
    name = "Kilo Power Reactor",
    params = [
        dict(
            key="max_kw_ac",
            units="kw",
            value=40,
            source="FAKE"
        ),
        dict(
            key="mass",
            units="kg",
            value=1500,
            source="https://en.wikipedia.org/wiki/Kilopower",
            notes="The space rated 10 kWe Kilopower for Mars is expected to mass 1500 kg in total (with a 226 kg core) and contain 43.7 kg of U235"
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        # Maybe rename kwh battery input?
        shared_states.kwh_for_battery = params.max_kw_ac
