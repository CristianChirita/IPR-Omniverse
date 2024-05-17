from omni.ui import scene as sc
from omni.ui import color as cl
import omni.ui as ui
from pxr import Gf
import asyncio
import aiohttp


class WidgetInfoManipulator(sc.Manipulator):
    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self.destroy()

    def destroy(self):
        self._root = None
        self._name_label = None
        self._slider_model = None

    def on_build_widgets(self):
        with ui.ZStack():
            ui.Rectangle(style={
                "background_color": cl(0.2),
                "border_color": cl(0.7),
                "border_width": 2,
                "border_radius": 4,
            })
            with ui.VStack():
                self._name_label = ui.Label("", height=0, alignment=ui.Alignment.CENTER)
                # setup some model, just for simple demonstration here
                self._slider_model = ui.SimpleFloatModel()
                ui.Spacer(height=5)
                with ui.HStack():
                    ui.Spacer(width=10)
                    ui.Label("scale", height=0, width=0)
                    ui.Spacer(width=5)
                    ui.FloatSlider(self._slider_model)
                    ui.Spacer(width=5)
                ui.Spacer(height=5)
        self.on_model_updated(None)
        

    def on_build(self):
        """Called when the model is changed and rebuilds the whole slider"""
        self._root = sc.Transform(visibile=False)
        with self._root:
            with sc.Transform(scale_to=sc.Space.SCREEN):
                with sc.Transform(transform=sc.Matrix44.get_translation_matrix(0, 100, 0)):
                    with sc.Transform(look_at=sc.Transform.LookAt.CAMERA):
                        self._widget = sc.Widget(500, 150, update_policy=sc.Widget.UpdatePolicy.ALWAYS)
                        self._widget.frame.set_build_fn(self.on_build_widgets)

    def on_model_updated(self, _):
        # if you don't have selection then show nothing
        if not self.model or not self.model.get_item("name"):
            self._root.visible = False
            return
        # Update the shapes
        position = self.model.get_as_floats(self.model.get_item("position"))
        if self._root:
            self._root.transform = sc.Matrix44.get_translation_matrix(*position)
            self._root.visible = True

        # Update the shape name
        if self._name_label:
            stage = self.model.usd_context.get_stage()
            prim = stage.GetPrimAtPath(self.model.current_path)
            ID_val = prim.GetAttribute("ID_attr").Get()
            run_loop = asyncio.get_event_loop()
            run_loop.create_task(self.get_data_from_api(ID_val))
            # http_resp = await self.get_data_from_api(ID_val)
            # self._name_label.text = f"Net Weight: {http_resp['NetWeight']}"
            # self._name_label.text = f"Prim:{self.model.get_item('name')}"

        # Update the slider
        def update_scale(prim_name, value):
            print(f"changing scale of {prim_name}, {value}")
            stage = self.model.usd_context.get_stage()
            prim = stage.GetPrimAtPath(self.model.current_path)
            scale = prim.GetAttribute("xformOp:scale")
            scale.Set(Gf.Vec3d(value, value, value))

        if self._slider_model:
            self._slider_subscription = None
            self._slider_model.as_float = 1.0
            self._slider_subscription = self._slider_model.subscribe_value_changed_fn(
                lambda m, p=self.model.get_item("name"): update_scale(p, m.as_float)
            )

    async def get_data_from_api(self, product):
        async with aiohttp.ClientSession(auth=aiohttp.BasicAuth('CHIRITACR','1Cristian')) as session:
        # with aiohttp.ClientSession(auth=aiohttp.BasicAuth('CHIRITACR','1Cristian')) as session:
            params = {'sap-client' : 732}
            url = f"https://ldcier8.wdf.sap.corp:44320/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0001/Product('{product}')"
            print("URL:", url)
            try:
                #make the request
                async with session.get(url, params=params) as resp:
                # with session.get(url, params=params) as resp:
                    print("HTTP response:", resp)
                    #get the response as json
                    result = await resp.json(content_type=None)

                    print("Net Weight:", result)
                    self._name_label.text = f"Net Weight: {result['NetWeight']}"
                    # return result
            except Exception as e:
                import carb
                print(e)
                carb.log_info(f"Caught Exception {e}")
