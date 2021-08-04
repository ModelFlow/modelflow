class Time:
    name = "Time"
    params = []
    states = [
        {
            "key": "utc_start",
            "label": "UTC Start",
            "units": "UTC Timestamp",
            "private": False,
            "value": 1794729600,
            "confidence": 0,
            "notes": "This is made a state instead of a parameter so it is accessible to other modules",
            "source": ""
        },
        {
            "key": "current_utc",
            "label": "Current UTC",
            "units": "UTC Timestamp",
            "private": False,
            "value": -1,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "seconds_per_sim_step",
            "label": "Seconds per sim step",
            "units": "Seconds",
            "private": False,
            "value": 3600,
            "confidence": 0,
            "notes": "This is made a state instead of a parameter so it is accessible to other modules",
            "source": ""
        },
        {
            "key": "hours_since_mars_midnight",
            "label": "Local Time at Landing Location",
            "units": "hours",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "https://www.giss.nasa.gov/tools/mars24/help/notes.html"
        }
    ]
    @staticmethod
    def run_step(states, params, utils):
        if states.current_utc == -1:
            states.current_utc = states.utc_start

        # TODO: Handle Mars Coordinated Time vs. earth UTC stuff
        states.current_utc += states.seconds_per_sim_step

        # TODO: Integrate with actual landing site location
        states.hours_since_mars_midnight += states.seconds_per_sim_step / 3600

        # Mars Sol is 24 hours 39 minutes 35.244 Earth seconds: https://www.giss.nasa.gov/tools/mars24/help/notes.html
        if states.hours_since_mars_midnight >= 24.65979:
            states.hours_since_mars_midnight = 0
