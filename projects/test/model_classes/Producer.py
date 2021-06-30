class Producer:
    name = "Producer"
    params = []
    states = [
        {
            "key": "widgets",
            "label": "Widgets",
            "units": "widgets",
            "private": False,
            "value": 0.0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.widgets += 5
    
