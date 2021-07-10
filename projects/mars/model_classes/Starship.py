class Starship:
    name = "starship"
    params = [
        {
            "key": "launch_utc",
            "label": "",
            "units": "UTC Timestamp",
            "private": False,
            "value": 1794916800,
            "confidence": 0,
            "notes": "This is one hour past the simulation start time as the time increment will happen before this model",
            "source": "Spreadsheet of launch windows"
        },
        {
            "key": "pressurized_cargo_volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 1100,
            "confidence": 0,
            "notes": "",
            "source": "https://www.spacex.com/vehicles/starship/"
        },
        {
            "key": "unpressurized_cargo_volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": "https://en.wikipedia.org/wiki/SpaceX_Starship"
        },
        {
            "key": "mass_utilization_warning_threshold",
            "label": "",
            "units": "percent",
            "private": False,
            "value": 0.7,
            "confidence": 0,
            "notes": "",
            "source": "none"
        },
        {
            "key": "volume_utilization_warning_threshold",
            "label": "",
            "units": "percent",
            "private": False,
            "value": 0.7,
            "confidence": 0,
            "notes": "",
            "source": "none"
        },
        {
            "key": "travel_days_to_mars",
            "label": "",
            "units": "days",
            "private": False,
            "value": 180,
            "confidence": 0,
            "notes": "",
            "source": "https://en.wikipedia.org/wiki/Mars_Direct"
        },
        {
            "key": "travel_days_from_mars",
            "label": "",
            "units": "days",
            "private": False,
            "value": 180,
            "confidence": 0,
            "notes": "Assumed to be same as to Mars. Not sure if that's correct",
            "source": "https://en.wikipedia.org/wiki/Mars_Direct"
        },
        {
            "key": "mars_stay_days",
            "label": "",
            "units": "days",
            "private": False,
            "value": 540,
            "confidence": 0,
            "notes": "",
            "source": "https://en.wikipedia.org/wiki/Mars_Direct"
        },
        {
            "key": "max_payload_from_leo_to_mars",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 100000,
            "confidence": 9,
            "notes": "",
            "source": "https://www.spacex.com/vehicles/starship/"
        },
        {
            "key": "max_payload_from_mars_to_earth",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 100000,
            "confidence": 0,
            "notes": "",
            "source": "none"
        },
        {
            "key": "distance_change_per_hour",
            "label": "",
            "units": "km/h",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "This is an ultra rough number used for first order calcs of pv generation",
            "source": "fake"
        }
    ]
    states = [
        {
            "key": "distance_from_sun",
            "label": "Distance from Sun",
            "units": "",
            "private": False,
            "value": 1234,
            "confidence": 0,
            "notes": "Used for calculating the decrease in solar production from Earth to Mars",
            "source": "fake"
        },
        {
            "key": "lox",
            "label": "Liquid Oxygen Fuel",
            "units": "kg",
            "private": False,
            "value": 936264,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "lch4",
            "label": "Liquid Methane Fuel",
            "units": "kg",
            "private": False,
            "value": 263736,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "status",
            "label": "Status",
            "units": "",
            "private": True,
            "value": "No Status",
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "payload_mass",
            "label": "Payload Mass",
            "units": "",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        },
        {
            "key": "payload_used_volume",
            "label": "Payload Used Volume",
            "units": "",
            "private": True,
            "value": 0,
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
    @staticmethod
    def run_step(states, params, utils):

        # DEBUG: This is expensive, we shouldn't need to calculate every time
        # states.payload_mass = utils.sum_children_attribute('mass')
        # print(states.payload_mass)

        seconds_since_launch = states.current_utc - params.launch_utc
        days_since_mission_start = seconds_since_launch / 60 / 60 / 24

        if days_since_mission_start < 0:
            states.status = 'Pre-launch'
        elif days_since_mission_start == 0:

            utils.log_event("LEO Trans Mars Injection Burn")

            states.payload_mass = utils.sum_children_attribute('mass')
            if states.payload_mass > params.max_payload_from_leo_to_mars:
                utils.terminate_sim_with_error(f"Exceeded payload initial mass capacity {states.payload_mass}kg vs {params.max_payload_from_leo_to_mars}kg")
                return

            if states.payload_mass < params.max_payload_from_leo_to_mars * params.mass_utilization_warning_threshold:
                utils.log_warning("Initial payload mass underutilized")

            # TODO: associate logs with models?
            utils.log_metric(name="Initial Payload Used Mass", value=states.payload_mass, units="kg")

            total_volume = utils.sum_children_attribute('volume')
            if total_volume > params.pressurized_cargo_volume:
                utils.terminate_sim_with_error("Exceeded payload initial volume capacity")
                return

            if total_volume < params.unpressurized_cargo_volume * params.volume_utilization_warning_threshold:
                utils.log_warning("Initial payload volume underutilized")

            utils.log_metric(name="Initial Payload Used Volume", value=states.payload_mass, units="kg")

            states.status = 'Launching from LEO'

        elif days_since_mission_start > 0 and days_since_mission_start < params.travel_days_to_mars:
            states.status = 'Traveling to Mars'

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun += params.distance_change_per_hour

        elif days_since_mission_start == params.travel_days_to_mars:
            states.status = 'Mars Landing'

            utils.log_event("Mars Landing")

            utils.change_parent_to("mars_surface")

        elif days_since_mission_start >= params.travel_days_to_mars and days_since_mission_start < params.travel_days_to_mars + params.mars_stay_days:
            # Note: distance from sun is still important here for solar panels.
            # Perhaps should not be associated with starship? unkonwn
            states.status = 'On Mars Surface'

        elif days_since_mission_start == params.travel_days_to_mars + params.mars_stay_days:
            # Pre launch checks on Mars
            states.payload_mass = utils.sum_children_attribute('mass')
            if states.payload_mass > params.max_payload_from_mars_to_earth:
                utils.terminate_sim_with_error(f"Exceeded payload return mass capacity {states.payload_mass}kg vs {params.max_payload_from_mars_to_earth}kg")
                return

            utils.log_event("Mars Ascent")

            states.status = 'Launching from Mars'

            utils.change_parent_to("interplanetary_space")

        elif days_since_mission_start > params.travel_days_to_mars + params.mars_stay_days and days_since_mission_start < params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:

            # distance from sun = data_lookup[days_passed] # For accurate number
            states.distance_from_sun -= params.distance_change_per_hour

            states.status = 'Traveling to Earth'


        elif days_since_mission_start == params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:
            utils.log_event("Earth Landing")

            states.status = 'Landing on Earth'

        elif days_since_mission_start > params.travel_days_to_mars + params.mars_stay_days + params.travel_days_from_mars:
            # No longer simulated on earth surface
            # TODO: some way to permanently remove instance from simulation.
            # utils.remove_self()

            states.status = 'Landed on Earth'
        else:
            utils.terminate_sim_with_error("Invalid Days Passed Option")
