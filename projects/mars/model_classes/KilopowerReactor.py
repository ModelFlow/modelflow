class KilopowerReactor:
    name = "('Kilo Power Reactor',)"
    params = [
        {
            "key": "max_kw_ac",
            "label": "",
            "units": "kw",
            "private": False,
            "value": 40,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 1500,
            "confidence": 0,
            "notes": "The space rated 10 kWe Kilopower for Mars is expected to mass 1500 kg in total (with a 226 kg core) and contain 43.7 kg of U235",
            "source": "https://en.wikipedia.org/wiki/Kilopower"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        }
    ]
    states = []
    @staticmethod
    def run_step(states, params, utils):

        # Maybe rename kwh battery input?
        states.kwh_for_battery = params.max_kw_ac
