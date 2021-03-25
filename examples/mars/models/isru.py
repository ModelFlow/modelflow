
class ISRU_Storages:
    states = [
        dict(
            key="isru_liquid_h2o",
            units="kg",
            value=0, # Note: May want to keep track of volume as well
        ),
        dict(
            key="isru_liquid_co2",
            units="kg",
            value=0, # Note: May want to keep track of volume as well
        ),
        dict(
            key="isru_gaseous_h2",
            units="kg",
            value=0, # Note: May want to keep track of volume as well
        )
    ]


class WaterIceMiningMachine:
    description = "Some machine that mines water ice and processes regolith"
    params = [
        dict(
            # NOTE: Super confusing that it says solid waste
            # but then it is h2o waste that is output from human
            key="kwh_per_kg_h2o",
            units="kWh/kg H2O",
            value=7,
            notes="Sanders (2010)  says 6.6kWh/kg for 8% water in soil and 13.9 for 3% water. HabNet says 7 and 12.2. Values for ice deposits will probably be much lower"
        ),
        dict(
            key="max_production_kg_h2o_per_hr",
            units="kg H2O/hr",
            value=31.25,
            notes="This is the minimum to make fuel in required time. Should definitely be higher"
            source="habnet",
        ),
        dict(
            key="mass_per_kg",
            units="kg/kg H2O/hr",
            value=103,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume_per_kg",
            units="m3/kg H2O/hr",
            value=0.38,
        )
    ]

    states = [
        dict(
            key="mass",
            units="kg",
            value=0,
            source='calculated'
        ),
        dict(
            key="volume",
            units="m3",
            value=0,
            source='calculated'
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        states.mass = params.mass_per_kg * params.max_production_kg_h2o_per_hr
        states.volume = params.volume_per_kg * params.max_production_kg_h2o_per_hr

        states.isru_liquid_h2o += params.max_production_kg_h2o_per_hr

        