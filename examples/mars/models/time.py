# Thinking that this module can handle much of what was initially thought to be included in the top level simulation params
# Ex:   
# "simulation_params": {
 #   "utc_start": 1794729600,
 #   "seconds_per_step": 3600,
 #   "max_num_steps": 21600,
 #   "random_seed": 1234
 # },


class Time:
    # Ensure that this runs before anything else
    run_priority = 10000

    name = "Time"
    description = "The module handles the time keeping"
    params = []
    states = [
        dict(
            key="utc_start",
            label="UTC Start",
            notes="This is made a state instead of a parameter so it is accessible to other modules via io",
            value=1794729600,
            units="UTC Timestamp",
        ),
        dict(
            key="current_utc",
            label="Current UTC",
            value=1794729600,
            units="UTC Timestamp",
        ),
        dict(
            key="seconds_per_sim_step",
            label="Seconds per sim step",
            notes="This is made a state instead of a parameter so it is accessible to other modules via io",
            value=3600,
            units="Seconds",
        ),
    ]

    @staticmethod
    def run_step(io, params, states, data, utils):
        states.current_utc += states.seconds_per_sim_step
