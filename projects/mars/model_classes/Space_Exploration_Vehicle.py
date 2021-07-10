class Space_Exploration_Vehicle:
    name = "SpaceExplorationVehicle"
    params = [
        {
            "key": "mass",
            "label": "",
            "units": "kg",
            "private": False,
            "value": 30000,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "length",
            "label": "",
            "units": "m",
            "private": False,
            "value": 4.48056,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "Width (Wheelbase)",
            "label": "",
            "units": "m",
            "private": False,
            "value": 3.9624,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "capacity",
            "label": "",
            "units": "person",
            "private": False,
            "value": 2,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "emergency_capacity",
            "label": "",
            "units": "person",
            "private": False,
            "value": 4,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "emergency_protection_time",
            "label": "",
            "units": "hours",
            "private": False,
            "value": 72,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "max_live_time",
            "label": "",
            "units": "days",
            "private": False,
            "value": 14,
            "confidence": 0,
            "notes": "",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        },
        {
            "key": "safe_range",
            "label": "",
            "units": "miles",
            "private": False,
            "value": 125,
            "confidence": 0,
            "notes": "Factsheet said it's the safe range for two or more SEVs, unknown what that means",
            "source": "https://www.nasa.gov/pdf/464826main_SEV_FactSheet_508.pdf"
        }
    ]
    states = [
        {
            "key": "status",
            "label": "Status",
            "units": "",
            "private": True,
            "value": "Packed",
            "confidence": 0,
            "notes": "",
            "source": ""
        }
    ]
