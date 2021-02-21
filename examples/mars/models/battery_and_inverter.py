class BatteryAndInverter:
    name = "battery"
    notes = "Eventually we may want to split up battery and inverter to do proper analysis of each"
    params = [
        dict(
            key="capacity_dc_kwh",
            units="kwh",
            value=4000,
            min=0,    # NOTE: Min and max are for parameter sweeps
            max=10000,
            source="FAKE"
        ),
        dict(
            key="capacity_dc_kw",
            units="kw",
            value=4000,
            min=0,
            max=10000,
            source="FAKE"
        ),
        dict(
            key="roundtrip_efficiency",
            units="decimal percent",
            value=0.95,
            source="FAKE"
        ),
        dict(
            key="Wh_per_kg",
            units="Wh/kg",
            value=200,
            source="FAKE"
        ),
        dict(
            key="m3_per_kwh",
            units="m3/kWh",
            value=0.0001,
            source="FAKE"
        )
    ]

    shared_states = [
        dict(
            key="available_dc_kwh",
            units="kwh",
            value=4000
        ),
        dict(
            key="generated_dc_kwh",
            notes="The is the way that generators send kwh to battery",
            units="kwh",
            value=0
        )
    ]

    private_states = [
        dict(
            key="mass",
            units="kg",
            value=0,  # Calculated
        ),
        dict(
            key="volume",
            units="m3",
            vallue=0,  # Calculated
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):

        if private_states.mass == 0:
            inverter_mass = 0 # TODO: Incorporate inverter mass
            private_states.mass = 1 / ( params.Wh_per_kg / 1000) * params.dc_capacity_kwh + inverter_mass
            private_states.volume = params.m3_per_kWh * params.dc_capacity_kwh

        if shared_states.available_dc_kwh < 0:
            utils.terminate_sim_with_error("available_dc_kwh was negative")

        if shared_states.available_dc_kwh == 0:
            utils.log_warning("Available AC kWh is zero!")

        # Due to current limitations in modeling setup
        # Apply the full round trip battery efficiency for
        # energy added to the battery instead of part when added in
        # and part when added out
        shared_states.available_dc_kwh += shared_states.generated_dc_kwh * params.roundtrip_efficiency

        # TODO: Check whether this shoudl be ac or dc
        if shared_states.available_dc_kwh > params.dc_capacity_kwh:
            shared_states.available_dc_kwh = params.dc_capacity_kwh

        # Reset the input DC bus so PV etc can be added in next sim tick
        shared_states.generated_dc_kwh = 0

        shared_states.available_dc_kwh = min(shared_states.available_dc_kwh, params.ac_capacity_kw)


# class DCDCInverter:
#     name = "DC DC Inverter"
#     description = "Converts DC Input from PV to voltage and current that the battery is ok with"
#     params = [
#         dict(
#             key="max_kw_ac",
#             # (Doesn't matter if kwh since hour hard coded currently)
#             units="kw",
#             value=50,
#             min=0,
#             max=10000,
#             source="FAKE"
#         ),
#         dict(
#             key="one_way_efficiency",
#             notes="You could have efficiency curves in here",
#             # (Doesn't matter if kwh since hour hard coded currently)
#             units="decimal percent",
#             value=0.98,
#             source="FAKE"
#         ),
#         dict(
#             key="mass",
#             value=2.6,
#             units="kg/kw",
#             notes="""
#             100kW: https://www.solaris-shop.com/solectria-pvi-100-240-100kw-inverter/
#             10kW: https://zerohomebills.com/product/solax-x3-10-0-t-d-3ph-10kw-solar-inverter/
#             """
#         )
#     ],
#     shared_states = [
#         dict(
#             key="available_dc_kwh",
#             units="kwh",
#             value=0
#         )
#     ]

#     @staticmethod
#     def run_step(shared_states, private_states, params, data, utils):
#         if shared_states.available_dc_kwh < 0:
#             utils.terminate_sim_with_error(
#                 "available_dc_kwh was negative in in pv inverter")

#         shared_states.available_dc_kwh += min(
#             shared_states.available_dc_kwh * params.one_way_efficiency, params.max_kw_ac)
