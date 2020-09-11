class Producer:

    definition = {
        "name": "producer",
        "params": [
            {
                "key": "max_widgets_per_hour_created",
                "units": "widgets",
                "value": 10
            },
            {
                "key": "cost_per_widget",
                "units": "$/widget",
                "value": 5
            }
        ],
        "states": [
            {
                # TODO: Handle case of having multiple states with same name
                # across different agents
                "key": "pmoney",
                "units": "usd",
                "value": 1000
            },
            {
                # TODO: This should probably be a linked output
                "key": "widgets",
                "units": "usd",
                "value": 1000
            }

        ],
        # "linked_input_states": [
        #     "money"
        # ],
        # "linked_output_states": [
        #     "widgets"
        # ]
    }

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        if states.pmoney <= 0:
            return

        widgets_per_hr = min(params.max_widgets_per_hour_created, states.pmoney // params.cost_per_widget)
        states.pmoney -= params.cost_per_widget * widgets_per_hr
        outputs.widgets += params.max_widgets_per_hour_created
