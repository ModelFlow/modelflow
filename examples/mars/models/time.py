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
            notes="This is made a state instead of a parameter so it is accessible to other modules",
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
            notes="This is made a state instead of a parameter so it is accessible to other modules",
            value=3600,
            units="Seconds",
        ),
        dict(
            key="hours_since_mars_midnight",
            label="Local Time at Landing Location",
            value=0,
            units="hours",
            note="This is a placeholder and completely wrong"
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        # TODO: Handle Mars Coordinated Time vs. earth UTC stuff
        states.current_utc += states.seconds_per_sim_step

        # TODO: Integrate with actual landing site location
        states.hours_since_mars_midnight += states.seconds_per_sim_step / 3600
        # TODO: Handle fact that mars sol is not 24 hours and this is completely wrong
        if states.hours_since_mars_midnight >= 24:
            states.hours_since_mars_midnight = 0

