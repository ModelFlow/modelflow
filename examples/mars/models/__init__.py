from models.humans import Human
from models.indoor_air import IndoorAir
from models.storages import WaterStorage, FoodStorage, WasteStorage
from models.location import Location
from models.pv import SolarArray
from models.pv_inverter import PVInverter
from models.battery import Battery
from models.lighting import Lighting

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
		Lighting()
	]
