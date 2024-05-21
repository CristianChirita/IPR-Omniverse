from omni.ui import scene as sc
import omni.ui as ui


class ObjInfoManipulator(sc.Manipulator):

    def on_model_updated(self, item):
        # Regenerate the manipulator
        self.invalidate()