class Location:
    name = "Location"
    params = [
	    {
	    "key": "landing_location",
            "label": "Landing Location",
            "units":"Name",
            "value": "Arcadia Planitia",
            "source":"https://www.nasa.gov/sites/default/files/atoms/files/hls2_newsletter_december_2019_v2.pdf",
            "notes":"Also: https://swim.psi.edu/resources/abstracts/9Mars/6427.pdf"
	    }
    ]
    states = [
	{
		
            "key": "latitude",
            "label": "Latitude",
            "notes": "This is made a state instead of a parameter so it is accessible to other modules",
            "value":30,
            "units":"degrees",
            "private": False,
            "confidence": 0,
	},
        { 
            "key":"longitude",
            "label":"Longitude",
            "notes":"This is made a state instead of a parameter so it is accessible to other modules",
            "value":200,
            "units":"degrees",
            "private": False,
            "confidence": 0,
	},
        {
            "key":"ice_rich_deposit_thickness",
            "label":"Ice Rich Deposit Thickness",
            "value":45,
            "units":"m",
            "source":"https://www.nasa.gov/sites/default/files/atoms/files/hls2_newsletter_december_2019_v2.pdf",
            "notes":"This is one option, another option is 100m: https://ntrs.nasa.gov/citations/20170000379"
            "private": False,
            "confidence": 0,
        },
        {
            "key":"min_ice_rich_deposit_initial_depth",
            "label":"Minimum Ice Rich Deposit Initial Depth",
            "value":0.5,
            "units":"m",
            "source":"https://ntrs.nasa.gov/citations/20170000379",
            "private": False,
            "confidence": 0,
        },
        {
            "key":"max_ice_rich_deposit_initial_depth",
            "label":"Maximum Ice Rich Deposit Initial Depth",
            "value":10,
            "units":"m",
            "source":"https://ntrs.nasa.gov/citations/20170000379"
            "private": False,
            "confidence": 0,
        },
        {
            "key":"mean_martian_solar_irradiance",
            "label":"Mean Martian Solar Irradiance",
            "notes":"Estimated at Arcadia Planitia (40° N) using optical depth data from 1998-2013 and solar panel tilt. Might be good to check code and overall method",
            "value":110,
            "units":"W/m^2",
            "source":"https://www.reddit.com/r/Colonizemars/comments/79k3z4/estimating_the_effectiveness_of_solar_power_at/"
            "private": False,
            "confidence": 0,
	}
    ]

    @staticmethod
    def run_step(states, params, utils):
	    pass