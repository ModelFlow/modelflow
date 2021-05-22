class Dehumidifier:
    name = "dehumidifier"
    params = [
        {
            "key": "target_relative_humidity",
            "label": "",
            "units": "decimal_percent",
            "private": False,
            "value": 0.6,
            "confidence": 0,
            "notes": "",
            "source": "https://letstalkscience.ca/educational-resources/backgrounders/humidity-on-earth-and-on-space-station"
        },
        {
            "key": "deadband",
            "label": "",
            "units": "decimal_percent",
            "private": False,
            "value": 0.02,
            "confidence": 0,
            "notes": "",
            "source": "https://letstalkscience.ca/educational-resources/backgrounders/humidity-on-earth-and-on-space-station"
        },
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 5,
            "confidence": 0,
            "notes": "",
            "source": "FAKE"
        },
        {
            "key": "volume",
            "label": "",
            "units": "m3",
            "private": False,
            "value": 1,
            "confidence": 0,
            "notes": "",
            "source": "NONE"
        }
    ]
    states = []
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
