class NuclearReactor:
    definition = {
        # TODO: Think of naming like kilopower instead
        "name": "nuclear_reactor",
        "scale_max": 10,
        "params": [
            dict(
                key="max_kw_ac",
                units="kw",
                value=40,
                source="FAKE"
            ),
            dict(
                key="mass",
                units="kg",
                value=4500,
                source="https://ats-fns.fi/images/files/2019/syp2019/presentations/PS2_PVenneri_NuclearTechnologyForSpaceSettlementsAndExploration.pdf",
                notes="Mass for UltraSafe Nuclear Technology's space reactor"
            ),
            dict(
                key="Lifespan",
                units="years",
                value=10,
                source="https://ats-fns.fi/images/files/2019/syp2019/presentations/PS2_PVenneri_NuclearTechnologyForSpaceSettlementsAndExploration.pdf",
                notes="Mass for UltraSafe Nuclear Technology's space reactor"
            ),
            dict(
                key="Heat Production",
                units="kelvin",
                value= 1150,
                source="https://ats-fns.fi/images/files/2019/syp2019/presentations/PS2_PVenneri_NuclearTechnologyForSpaceSettlementsAndExploration.pdf",
                notes="Mass for UltraSafe Nuclear Technology's space reactor"
            )
        ],
        "states": [],
        "linked_output_states": [
            "kwh_for_battery"
        ]
    }

    @staticmethod
    def cost(params, states):
        return params.mass


    @staticmethod
    def run_step(io, params, states, data):
        io.kwh_for_battery = params.max_kw_ac
