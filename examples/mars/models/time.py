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
    shared_states = [
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
            notes="This is made a state instead of a parameter so it is accessible to other modules via shared states",
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
    def run_step(shared_states, private_states, params, data, utils):
        # TODO: Handle Mars Coordinated Time vs. earth UTC stuff
        shared_states.current_utc += shared_states.seconds_per_sim_step

        # TODO: Integrate with actual landing site location
        shared_states.hours_since_mars_midnight += shared_states.seconds_per_sim_step / 3600
        # TODO: Handle fact that mars sol is not 24 hours and this is completely wrong
        if shared_states.hours_since_mars_midnight >= 24:
            shared_states.hours_since_mars_midnight = 0

