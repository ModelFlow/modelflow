class Battery:
    name = "battery"
    params = [
        dict(
            key="dc_capacity_kwh",
            units="kwh",
            value=4000,
            min=0,
            max=10000,
            source="FAKE"
        ),
        dict(
            key="ac_capacity_kw",
            units="kw",
            value=1000,
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
            source="wikipedia"
        )
    ],
    shared_states= [
        dict(
            key="enrg_kwh", # Oddly this is the AC energy available
            units="kwh",
            value=1000
        ),
        dict(
            key="kwh_for_battery", # Oddly this is the kwh set to be input to battery
            units="kwh",
            value=0
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        if shared_states.dc_kwh_available < 0:
            utils.terminate_sim_with_error("dc_kwh_available was negative")

        if shared_states.ac_kwh_available < 0:
            utils.terminate_sim_with_error("ac_kwh_available was negative")

        if shared_states.ac_kwh_available == 0:
            utils.log_warning("Available AC kWh is zero!")

        # Due to current limitations in modeling setup
        # Apply the full round trip battery efficiency for
        # energy added to the battery instead of part when added in
        # and part when added out
        shared_states.ac_kwh_available += shared_states.dc_kwh_available * params.roundtrip_efficiency

        # TODO: Check whether this shoudl be ac or dc
        if shared_states.ac_kwh_available > params.dc_capacity_kwh:
            shared_states.ac_kwh_available = params.dc_capacity_kwh

        # Reset the DC bus so PV etc can be added in next sim tick
        shared_states.dc_kwh_available = 0


        shared_states.ac_kwh_available = min(shared_states.ac_kwh_available, params.ac_capacity_kw)
