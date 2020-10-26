from models.humans import Human
from models.indoor_air import IndoorAir
from models.storages import WaterStorage, FoodStorage, WasteStorage
from models.location import Location
from models.pv import SolarArray
from models.pv_inverter import PVInverter
from models.battery import Battery
from models.lighting import Lighting
from models.nuclear_reactor import NuclearReactor
from models.structures import HabitatStructure
from models.plants import Plants
from models.eclss import Heater, CH4RemovalAgent, Dehumidifier, ParticulateRemovalTCCS, CO2Removal, CO2ReductionSabatier, OxygenFromHydrolysis, MultifiltrationPurifierPostTreatment, UrineRecyclingProcessor, SolidWasteAerobicBioReactor

def list_models():
	return [
		Human(),
		IndoorAir(),
		WaterStorage(),
		FoodStorage(),
		WasteStorage(),
		Location(),
		SolarArray(),
		PVInverter(),
		Battery(),
		Lighting(),
		NuclearReactor(),
		HabitatStructure(),
		Heater(),
		CH4RemovalAgent(),
		Dehumidifier(),
		ParticulateRemovalTCCS(),
		CO2Removal(),
		CO2ReductionSabatier(),
		OxygenFromHydrolysis(),
		MultifiltrationPurifierPostTreatment(),
		UrineRecyclingProcessor(),
		SolidWasteAerobicBioReactor(),
		Plants()
	]
