class UrineProcessorAssembly:
    name =  "Urine Processor Assembly"
    description = "First stage recovery of urine"
    params = [
        dict(
            key="max_urine_consumed_per_hour",
            notes="9 kg/day / 24 per wikipedia",
            units="kg/hr",
            value=0.375,
            source="https://en.wikipedia.org/wiki/ISS_ECLSS",
        ),
        dict(
            key="min_urine_consumed_per_hour",
            units="kg/hr",
            value=0.1,
            source="fake",
        ),
        dict(
            key="dc_kwh_consumed_per_hour",
            notes="TODO: Should be per kg input",
            units="kwh",
            value=1.501,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="efficiency",
            notes="Not sure if this is accurate",
            units="decimal %",
            value=0.85,
            source="https://en.wikipedia.org/wiki/ISS_ECLSS",
        ),
        dict(
            key="mass",
            units="kg",
            value=193.3,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume",
            units="m3",
            value=0.39,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        if states.urine < params.min_urine_consumed_per_hour:
            return
        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        urine_processed = min(states.urine, params.max_urine_consumed_per_hour)
        states.urine -= urine_processed
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        states.unfiltered_water += urine_processed
        # states.solid_waste += params.solid_waste_output_per_hour


class WaterProcessorAssembly:
    name = "Water Processor Assembly"
    description = "Second stage multifiltration beds" 
    params = [
        dict(
            key="max_h2o_tret_processed_per_hour",
            units="kg/hr",
            value=5.8967,
            notes="Comes from 13 lb/hr in source. I'm not sure if this is correct.",
            source="https://ntrs.nasa.gov/api/citations/20050207388/downloads/20050207388.pdf",
        ),
        dict(
            key="dc_kwh_consumed_per_hour",
            units="kwh",
            value=1.501,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="mass",
            units="kg",
            value=114.6,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume",
            units="m3",
            value=0.11,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        if states.unfiltered_water < params.max_h2o_tret_processed_per_hour:
            return
        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        processed = min(states.unfiltered_water, params.max_h2o_tret_processed_per_hour)
        states.unfiltered_water -= processed
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)
        states.potable_water += processed


class HydrolysisSystem:
    name = "Hydrolysis System"
    description = "Generates oxygen and hydrogen through electrolysis of water"
    params = [
        dict(
            # NOTE: Super confusing that it says solid waste
            # but then it is h2o waste that is output from human
            key="potable_water_consumed_per_hour",
            units="kg/hr",
            value=0.413,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="dc_kwh_consumed_per_hour",
            units="kwh",
            value=0.959,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="atmo_h2_output_per_hour",
            units="kg/hr",
            value=0.0454, # Note: This should not go in atmosphere
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="atmo_o2_output_per_hour",
            units="kg/hr",
            value=0.367,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="run_below_atmo_o2_ratio",
            units="kg/hr",
            value=0.195,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="mass",
            units="kg",
            value=193.3,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume",
            units="m3",
            value=0.39,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        total_atmosphere = states.atmo_o2 + states.atmo_n2 + states.atmo_co2
        o2_ratio = states.atmo_o2 / float(total_atmosphere)
        if o2_ratio >= params.run_below_atmo_o2_ratio:
            return

        if states.potable_water < params.potable_water_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.potable_water -= min(states.potable_water, params.potable_water_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        # states.atmo_h2 += params.atmo_h2_output_per_hour
        states.atmo_o2 += params.atmo_o2_output_per_hour


class SabatierReactor:
    name = "Sabatier Reactor"
    notes = "It is unclear whether the ISRU sabatier reactor can be used here"
    description = "Reduces carbon dioxide without requiring venting"
    params= [
        dict(
            # NOTE: Super confusing that it says solid waste
            # but then it is h2o waste that is output from human
            key="atmo_h2_consumed_per_hour",
            units="kg/hr",
            value=0.00163,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="dc_kwh_consumed_per_hour",
            units="kwh",
            value=0.291,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="atmo_co2_consumed_per_hour",
            units="kg/hr",
            value=0.006534, # Note: This should not go in atmosphere
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="atmo_ch4_output_per_hour",
            units="kg/hr",
            value=0.0025,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="solid_waste_output_per_hour",
            units="kg/hr",
            value=0.00567,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="run_above_co2_ppm",
            units="ppm",
            value=1000,
            source="https://www.epa.gov/sites/production/files/2014-08/documents/appena.pdf"
        ),
        dict(
            key="mass",
            units="kg",
            value=193.3,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume",
            units="m3",
            value=0.39,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):


        total_atmosphere = states.atmo_o2 + states.atmo_n2 + states.atmo_co2
        co2_ratio = states.atmo_co2 / float(total_atmosphere)
        if co2_ratio <= params.run_above_co2_ppm:
            return

        if states.atmo_h2 < params.atmo_h2_consumed_per_hour:
            return

        if states.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.atmo_h2 -= min(states.atmo_h2, params.potable_water_consumed_per_hour)
        states.atmo_co2 -= min(states.atmo_co2, params.atmo_co2_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)

        states.atmo_ch4 += params.atmo_ch4_output_per_hour
        states.solid_waste += params.solid_waste_output_per_hour


class CO2Scubbers:
    name = "co2_scrubbers"
    description = "Zeolite beds that capture CO2 from the atmosphere"
    params = [
        dict(
            # NOTE: Super confusing that it says solid waste
            # but then it is h2o waste that is output from human
            key="atmo_co2_consumed_per_hour",
            units="kg/hr",
            value=1,
            source="FAKE"
        ),
        dict(
            key="dc_kwh_consumed_per_hour",
            units="kwh",
            value=0.65,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="run_above_co2_ppm",
            units="ppm",
            value=1000,
            source="https://www.epa.gov/sites/production/files/2014-08/documents/appena.pdf"
        ),
        dict(
            key="mass",
            units="kg",
            value=137.35,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        ),
        dict(
            key="volume",
            units="m3",
            value=0.31,
            source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        # states.atmo_co2 = 0

        total_atmosphere = states.atmo_o2 + states.atmo_n2 + states.atmo_co2
        
        co2_ppm = (states.atmo_co2 / float(total_atmosphere)) * 1e6
        if co2_ppm < params.run_above_co2_ppm:
            return

        if states.atmo_co2 < params.atmo_co2_consumed_per_hour:
            return

        if states.available_dc_kwh < params.dc_kwh_consumed_per_hour:
            return

        states.atmo_co2 -= min(states.atmo_co2, params.atmo_co2_consumed_per_hour)
        states.available_dc_kwh -= min(states.available_dc_kwh, params.dc_kwh_consumed_per_hour)
        # TODO: Where does the output go


class Heater:
    name = "heater"
    description = "Heats habitat atmosphere"
    params = [
        dict(
            key="max_kw_output",
            units="kw",
            value=10,
            source="NONE",
        ),
        dict(
            key="min_kw_output",
            units="kw",
            value=0.5,
            source="NONE",
        ),
        dict(
            key="target_temp",
            units="degrees c",
            value=20,
            source="NONE",
        ),
        dict(
            key="temp_dead_band",
            units="degrees c",
            value=0.3,
            source="NONE",
        ),
        dict(
            key="mass",
            units="kg",
            value=20,
            source="FAKE",
        ),
        dict(
            key="volume",
            units="m3",
            value=1,
            source="NONE",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):

        # Dumb heater
        # max power if below deadband

        # Smart heater
        # Calculate what KW would be needed to raise
        # temperature between current temp and target temp

        # Don't run if within deadband of target temp or above

        if states.atmo_temp < params.target_temp - params.temp_dead_band:
            # TODO: Replace with a smart heating strategy
            states.heat_diff_kwh += params.min_kw_output


class Dehumidifier:
    name = "dehumidifier"
    description = "Recovers H2O in atmosphere into unfiltered water"
    params = [
        dict(
            key="target_relative_humidity",
            units="decimal_percent",
            value=0.6,
            source="https://letstalkscience.ca/educational-resources/backgrounders/humidity-on-earth-and-on-space-station",
        ),
        dict(
            key="deadband",
            units="decimal_percent",
            value=0.02,
            source="https://letstalkscience.ca/educational-resources/backgrounders/humidity-on-earth-and-on-space-station",
        ),
        dict(
            key="mass",
            units="kg",
            value=5,
            source="FAKE",
        ),
        dict(
            key="volume",
            units="m3",
            value=1,
            source="NONE",
        )
    ]

    @staticmethod
    def run_step(states, params, utils):
        # http://hyperphysics.phy-astr.gsu.edu/hbase/Kinetic/relhum.html
        actual_vapor_density = states.atmo_h2o / states.atmo_volume  # kg/m3
        saturation_vapor_density = 17.3 / 1000 # kg/m3
        relative_humidity = actual_vapor_density / saturation_vapor_density

        # If the humidity is below target plus deadband, ignore
        if relative_humidity <= params.target_relative_humidity + params.deadband:
            return

        target_actual_vapor_density = params.target_relative_humidity * saturation_vapor_density
        density_diff = actual_vapor_density - target_actual_vapor_density
        h2o_kg_to_remove = density_diff * states.atmo_volume
        states.unfiltered_water += h2o_kg_to_remove
        states.atmo_h2o -= h2o_kg_to_remove
