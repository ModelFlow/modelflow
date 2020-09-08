from datetime import datetime, timedelta
# TODO: Handle datetimes
import numpy as np


class Location:
    definition = {
        "name": "location",
        # TODO: Figure out the dependency tree to set which steps to run
        "priority": 0,

        # TODO: Need way to initialize time
        "params": [],
        "states": [
            dict(
                key="hours_since_midnight",
                units="hours",
                # initial_val=0,
                value=0
            ),
            # Mainly doing this because makes it easier to plot
            # things in Tableau
            dict(
                key="datetime",
                units="datetime",
                value=0 #np.datetime64('2024-01-01')
            )

        ]
    }

    @staticmethod
    def run_step(inputs, outputs, params, states, data):
        if states.hours_since_midnight == 23:
            states.hours_since_midnight = 0
        else:
            states.hours_since_midnight += 1

        states.datetime += 15 # np.timedelta64(1, 'h')
