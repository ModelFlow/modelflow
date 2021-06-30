class Consumer:
    name = "Consumer"
    params = [
        {
            "key": "widgets_consumed_per_hour",
            "label": "Widgets Per Hour",
            "units": "widgets",
            "private": False,
            "value": 1.0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    states = []

    @staticmethod
    def run_step(states, params, utils):
        states.widgets -= params.widgets_consumed_per_hour
    
    
