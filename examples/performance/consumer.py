class Consumer:

    definition = {
        "name": "consumer",
        "params": [
            {
                "key": "max_widgets_per_hour_consumed",
                "units": "widgets",
                "value": 5
            },
            {
                "key": "paid_per_widget",
                "units": "$/widget",
                "value": 10
            }
        ],
        "states": [
            {
                "key": "cmoney",
                "units": "usd",
                "value": 1000
            }
        ],
        # "linked_inputs_states": [
        #     "widgets"
        # ],
        # "linked_output_states": [
        #     "widgets"
        # ]

    }

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        if states.cmoney > 0:
            consumed = min(params.max_widgets_per_hour_consumed, states.cmoney // params.paid_per_widget)
            inputs.widgets -= consumed
            outputs.pmoney += params.paid_per_widget * consumed
            states.cmoney -= params.paid_per_widget * consumed
