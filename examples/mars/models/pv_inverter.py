class PVInverter:
    name = "PV Inverter"
    params = [
        dict(
            key="max_kw_ac",
            units="kw", # (Doesn't matter if kwh since hour hard coded currently)
            value=50,
            min=0,
            max=10000,
            source="FAKE"
        ),
        dict(
            key="one_way_efficiency",
            notes="You could have efficiency curves in here",
            units="decimal percent", # (Doesn't matter if kwh since hour hard coded currently)
            value=0.98,
            source="FAKE"
        ),
        dict(
            key="mass",
            value=2.6,
            units="kg/kw",
            notes="""
            100kW: https://www.solaris-shop.com/solectria-pvi-100-240-100kw-inverter/
            10kW: https://zerohomebills.com/product/solax-x3-10-0-t-d-3ph-10kw-solar-inverter/
            """
        )
    ],
    shared_states = [
        # TODO: Come up with better way to store inputs/outputs
        dict(
            key="dc_kwh",
            units="kwh",
            value=0
        )
    ]

    @staticmethod
    def run_step(shared_states, private_states, params, data, utils):
        if io.dc_kwh < 0:
            raise Exception("negative power input to inverter. Makes no sense")

        io.kwh_for_battery += min(io.dc_kwh * params.one_way_efficiency, params.max_kw_ac)
