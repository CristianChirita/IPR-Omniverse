import omni.ext
import omni.ui as ui
import asyncio
import aiohttp
# Any class derived from `omni.ext.IExt` in top level module (defined in `python.modules` of `extension.toml`) will be
# instantiated when extension gets enabled and `on_startup(ext_id)` will be called. Later when extension gets disabled
# on_shutdown() is called.
class MyExtension(omni.ext.IExt):
    # ext_id is current extension id. It can be used with extension manager to query additional information, like where
    # this extension is located on filesystem.

    def on_startup(self, ext_id):
        print("[omni.example.apiconnect] MyExtension startup")

        #create a new window
        self._window = APIWindowExample("API Connect Example", width=260, height=270)

    def on_shutdown(self):
        print("[omni.example.apiconnect] MyExtension shutdown")
        if self._window:
            self._window.destroy()
            self._window = None

class APIWindowExample(ui.Window):
    async def get_data_from_api(self, product):
        async with aiohttp.ClientSession(auth=aiohttp.BasicAuth('CHIRITACR','1Cristian')) as session:
            params = {'sap-client' : 732}
            url = f"https://ldcier8.wdf.sap.corp:44320/sap/opu/odata4/sap/api_product/srvd_a2x/sap/product/0001/Product('{product}')"
            try:
                #make the request
                async with session.get(url, params=params) as resp:
                    #get the response as json
                    result = await resp.json(content_type=None)

                    #get the palette from the json
                    data=result['results'][0]

                    print(result)
            except Exception as e:
                import carb
                print(e)
                carb.log_info(f"Caught Exception {e}")

    #async function to get the color palette from huemint.com
    async def get_colors_from_api(self, color_widgets):
        async with aiohttp.ClientSession() as session:
            url = 'https://api.huemint.com/color'
            data = {
                "mode":"transformer", #transformer, diffusion or random
                "num_colors":"5", # max 12, min 2
                "temperature":"1.2", #max 2.4, min 0
                "num_results":"1", #max 50 for transformer, 5 for diffusion
                "adjacency":[ "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"], #nxn adjacency matrix as a flat array of strings
                "palette":["-", "-", "-", "-", "-"] #locked colors as hex codes, or '-' if blank
                }
            try:
                #make the request
                async with session.post(url, json=data) as resp:
                    #get the response as json
                    result = await resp.json(content_type=None)

                    #get the palette from the json
                    palette=result['results'][0]['palette']

                    print(palette)
            except Exception as e:
                import carb
                carb.log_info(f"Caught Exception {e}")

    def __init__(self, title: str, **kwargs) -> None:
        super().__init__(title, **kwargs)
        self.frame.set_build_fn(self._build_fn)
    def _build_fn(self):
        with self.frame:
            with ui.VStack(alignment=ui.Alignment.CENTER):
                run_loop = asyncio.get_event_loop()
                ui.Label("Click the button to get a new color palette",height=30, alignment=ui.Alignment.CENTER)
                with ui.HStack(height=100):
                    color_widgets = [ui.ColorWidget(1,1,1) for i in range(5)]
                def on_click():
                    run_loop.create_task(self.get_data_from_api('AVC_RBT_ROBOT'))
                #create a button to trigger the api call
                self.button = ui.Button("Refresh", clicked_fn=on_click)