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
            key="wh_per_kg",
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

    states = [
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
        ),
        dict(
            key="mass",
            units="kg",
            value=0,
            private=True,
        ),
        dict(
            key="volume",
            units="m3",
            value=0,
            private=True,
        )
    ]

    @staticmethod
    def run_step(states, params, utils):


        if states.mass == 0:
            inverter_mass = 0 # TODO: Incorporate inverter mass
            states.mass = 1 / ( params.wh_per_kg / 1000) * params.capacity_dc_kwh + inverter_mass
            states.volume = params.m3_per_kwh * params.capacity_dc_kwh

        if states.available_dc_kwh < 0:
            utils.terminate_sim_with_error("available_dc_kwh was negative")

        if states.available_dc_kwh == 0:
            utils.log_warning("Available AC kWh is zero!")

        # Due to current limitations in modeling setup
        # Apply the full round trip battery efficiency for
        # energy added to the battery instead of part when added in
        # and part when added out
        states.available_dc_kwh += states.generated_dc_kwh * params.roundtrip_efficiency

        # TODO: Check whether this shoudl be ac or dc
        if states.available_dc_kwh > params.capacity_dc_kwh:
            states.available_dc_kwh = params.capacity_dc_kwh

        # Reset the input DC bus so PV etc can be added in next sim tick
        states.generated_dc_kwh = 0

        # Hack for clipping by max available power
        states.available_dc_kwh = min(states.available_dc_kwh, params.capacity_dc_kw)


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
#     states = [
#         dict(
#             key="available_dc_kwh",
#             units="kwh",
#             value=0
#         )
#     ]

#     @staticmethod
#     def run_step(states, params, utils):

#         if states.available_dc_kwh < 0:
#             utils.terminate_sim_with_error(
#                 "available_dc_kwh was negative in in pv inverter")

#         states.available_dc_kwh += min(
#             states.available_dc_kwh * params.one_way_efficiency, params.max_kw_ac)
