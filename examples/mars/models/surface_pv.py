
class SurfacePV:
    # Ensure that this runs before anything else
    # TODO: Support run priority
    run_priority = 0
    name = "Surface PV"
    # TODO: add some utilities for changing sizing, ex make mass per kW
    params = [
        dict(
            key="rated_pv_kw_dc_output",
            units="kw",
            value=200,
            source="FAKE",
        ),
        dict(
            key="degredation_per_hour",
            notes="TODO: Create an actual degredation model",
            units="decimal percent",
            value=0.00001,
            source="FAKE",
        ),
        dict(
            key="hours_to_deploy",
            description="Hours it will take to deploy the entire system",
            notes="There is currently no support for partial deployments",
            units="hours",
            value=120,
            source="FAKE",
        )
    ]

    private_states = [
        dict(
            key="mass",
            units="kg",
            value=100,
            source="fake",
        ),
        dict(
            key="volume",
            units="m3",
            value=100,
            source="fake",
        ),
        dict(
            key="status",
            units="string",
            value="packed"
        ),
        dict(
            key="deployed_hours",
            units="hours",
            value=0
        ),
        dict(
            key="deploying_hours",
            units="hours",
            value=0
        )

    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        # TODO: Handle that an example where the parent location is outside
        # but there is a shared electrical connection
        if not utils.has_parent_instance_named("mars_surface"):
            return
    
        if private_states.status == 'packed':
            private_states.status == 'deploying'
            # Assuming that as soon as you land on the surface, deployment starts

        elif private_states.status == 'deploying':
            private_states.deploying_hours += 1
            if private_states.deploying_hours > params.hours_to_deploy:
                private_states.status == 'deployed'

                instance_key = utils.get_instance_key()
                utils.log_event(f"Surface PV instance '{instance_key}' deployed")

        elif private_states.status == 'deployed':
            private_states.deployed_hours += 1

            degradation = 1 - private_states.deployed_hours * params.degredation_per_hour

            # Note: Assuming that we are not using the integrated starship PV on Mars to not degrade it

            # ULTRA FAKE PV MODEL...plz change
            if shared_states.hours_since_mars_midnight > 6 and shared_states.hours_since_mars_midnight <= 7:
                shared_states.kwh_generated += params.rated_pv_kw_dc_output * 0.5 * degradation
            elif shared_states.hours_since_mars_midnight > 7 and shared_states.hours_since_mars_midnight < 17:
                shared_states.kwh_generated += params.rated_pv_kw_dc_output * degradation
            elif shared_states.hours_since_mars_midnight >= 17 and shared_states.hours_since_mars_midnight < 18:
                shared_states.kwh_generated += params.rated_pv_kw_dc_output * 0.5 * degradation
            else:
                shared_states.kwh_generated += 0

# Reminder of old pv data that came from CSV of earth

# import os
# import pandas as pd
# from pathlib import Path


# class SolarArray:
#     definition = {
#         # Want some naming indication that this is a
#         # solar array from data.
#         "name": "solar_array",
#         "params": [
#             dict(
#                 key="scaling_factor",
#                 units="kw", # (Doesn't matter if kwh since hour hard coded currently)
#                 value=100,
#                 min=0,
#                 max=10000
#             ),
#             dict(
#                 key="mass",
#                 units="kg/kw",
#                 value=1.1,
#                 source='https://www.reddit.com/r/spacex/comments/dopbfz/estimating_what_building_a_110_mw_solar_park_on/',
#                 notes="https://ntrs.nasa.gov/citations/20040191326"
#             )
#         ],
#         "states": [
#             dict(
#                 # Note: This should probably be a global var
#                 # currently used to index into csv for power gen
#                 key="time_since_start",
#                 units="hours",
#                 # initial_val=0,
#                 value=0
#             ),

#         ],
#         "linked_output_states": [
#             "dc_kwh"
#         ]
#     }

#     @staticmethod
#     def cost(params, states):
#         return params.mass * params.scaling_factor

#     # NOTE: loading this pv data from earth is obviously
#     # a bad idea, but demonstrates incorporating hard coded
#     # time series data as a constraint
#     @staticmethod
#     def load_data():
#         filepath = os.path.join(
#             Path(__file__).parent.parent.absolute(), 'data', 'pvwatts_hourly.csv')
#         return pd.read_csv(filepath).values[:,0]

#     @staticmethod
#     def run_step(io, params, states, data):
#         io.dc_kwh = data[states.time_since_start % len(data)] * params.scaling_factor
#         states.time_since_start += 1
