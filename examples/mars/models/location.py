from datetime import datetime, timedelta
from modelflow.modelflow import Model, ModelParam, ModelState

class Location(Model):
    def setup(self):
        self.name = "location"
        # TODO: Figure out the dependency tree to set which steps to run
        self.priority = 0

        # TODO: Need way to initialize time

        self.states = [
            ModelState(
                key="hours_since_midnight",
                units="hours",
                # initial_val=0,
                value=0
            ),
            # Mainly doing this because makes it easier to plot
            # things in Tableau
            ModelState(
                key="datetime",
                units="datetime",
                value=datetime(2024,1,1,0,0,0)
            )

        ]

    def run_step(self, inputs, outputs, params, states):
        if states.hours_since_midnight == 23:
            states.hours_since_midnight = 0
        else:
            states.hours_since_midnight += 1

        states.datetime += timedelta(hours=1)
