from modelflow.modelflow import Model, ModelParam, ModelState


class StorageModel(Model):

    def setup(self):
        self.params = []
        self.name = None
        self.additional_setup()
        if self.name is None:
            raise Exception("Must provide name in additional setup")
        self.states = self.storage_states()

        for key, value in self.storage_maximums().items():
            self.params.append(ModelParam(
                key=f"max_{key}",
                label=f"Maximum {key.title()} Storable",
                description="This maximum amount that this store can hold",
                units="kg",  # TODO: Pull this from the state unit
                value=value,
                source="https://simoc.space/wp-content/uploads/2020/06/simoc_agent_currencies-20200601.pdf",
            ))

    def additional_setup(self):
        raise NotImplementedError("Must Override")

    def storage_states(self):
        raise NotImplementedError("Must Override")

    def storage_maximums(self):
        raise NotImplementedError("Must Override")

    def run_step(self, inputs, outputs, params, states):
        # TODO: Improve this hack due to 
        # states not actually being only internal states
        for param_key, max_param in params.__dict__.items():
            key = param_key[4:]
            value = getattr(states, key)
            if value > max_param:
                print(f"Hit maximum {key} limit")
                setattr(states, key, max_param)

            if value < 0:
                raise Exception(f"{key} went negative")


class WaterStorage(StorageModel):

    def additional_setup(self):
        self.name = "water_storage"

    def storage_states(self):
        return [
            ModelState(
                key="h2o_potb",
                units="kg",
                value=1341
            ),
            ModelState(
                key="h2o_tret",
                units="kg",
                value=1341
            )
        ]

    def storage_maximums(self):
        return dict(h2o_potb=4000, h2o_tret=4000)


class WasteStorage(StorageModel):

    def additional_setup(self):
        self.name = "waste_storage"

    def storage_states(self):
        return [
            ModelState(
                key="h2o_urin",
                units="kg",
                value=0
            ),
            ModelState(
                key="h2o_waste",
                units="kg",
                value=0
            ),
            ModelState(
                key="solid_waste",
                units="kg",
                value=0
            )
        ]

    def storage_maximums(self):
        return dict(h2o_urin=4000, h2o_waste=4000, solid_waste=4000)


class FoodStorage(StorageModel):

    def additional_setup(self):
        self.name = "food_storage"

    def storage_states(self):
        return [
            ModelState(
                key="food_edbl",
                units="kg",
                value=0
            )
        ]

    def storage_maximums(self):
        return dict(food_edbl=10000)


class NutrientStorage(StorageModel):

    def additional_setup(self):
        self.name = "nutrient_storage"
        self.description = """
            These are the nutrients within soil or
            hydroponic system"""

    def storage_states(self):
        return [
            ModelState(
                key="solid_n",
                units="kg",
                value=100  # TODO: This number does not seem realistic
            ),
            ModelState(
                key="solid_p",
                units="kg",
                value=100  # TODO: This number does not seem realistic
            ),
            ModelState(
                key="solid_k",
                units="kg",
                value=100  # TODO: This number does not seem realistic
            )
        ]

    def storage_maximums(self):
        return dict(solid_n=1000, solid_k=1000, solid_p=1000)


class EnergyStorage(StorageModel):

    def additional_setup(self):
        self.name = "energy_storage"
        # NOTE: This basic battery model will probably need to be overriden
        self.params = [
            ModelParam(
                key="mass",
                label="Battery Mass",
                description="Mass of battery electrical system",
                units="kg",
                value=226.796,
                notes="not sure about this",
            ),
            ModelParam(
                key="volume",
                label="Battery Volume",
                description="Volume of battery electrical system",
                units="m3",
                value=0.368,
                notes="not sure about this",
            )
        ]

    def storage_states(self):
        # Think about immutable states. Ex: battery volume / mass
        return [
            ModelState(
                key="enrg_kwh",
                units="kwh",
                value=1000
            )
        ]

    def storage_maximums(self):
        return dict(enrg_kwh=1000)