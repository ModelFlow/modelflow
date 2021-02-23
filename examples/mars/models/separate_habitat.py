class HabitatStructure:
    params = [
        dict(
            key="leak_rate",
            description="Note: there was also some mars one paragon report on this",
            units="decimal percent of atm / hr", # Note: Maybe there can be a warning on non standard units
            value=0.0001,
            source="FAKE. But could look at https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20110012997.pdf"
        ),
        dict(
            key="heat_loss_per_hour",
            notes="Improvements could be made to different heat fluxes during different times of day",
            units="kwh",
            value=0.25,
            source="FAKE"
        )
    ],
    # TODO: Every EVA you can have air loss

    @staticmethod
    def run_step(states, params, utils):

        states.atmo_co2 -= states.atmo_co2 * params.leak_rate
        states.atmo_o2 -= states.atmo_o2 * params.leak_rate
        states.atmo_n2 -= states.atmo_n2 * params.leak_rate
        states.atmo_ch4 -= states.atmo_ch4 * params.leak_rate
        states.atmo_h2 -= states.atmo_h2 * params.leak_rate

        states.heat_diff_kwh -= params.heat_loss_per_hour
