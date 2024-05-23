# Copyright 2019-2024 NVIDIA CORPORATION

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import carb.input
import carb.settings
import carb.tokens
import omni.ext
import omni.usd
import asyncio

import omni.kit.livestream.messaging as messaging


# This here to satisfy unit test for now.
# Functions and vars are available to other extension as usual in python: `example.python_ext.some_public_function(x)`
def some_public_function(x: int):
    print(f"[sap.configurator.viewer.messaging] some_public_function was called with {x}")
    return x ** x


# Any class derived from `omni.ext.IExt` in top level module (defined in `python.modules` of `extension.toml`) will be
# instantiated when extension gets enabled and `on_startup(ext_id)` will be called. Later when extension gets disabled
# on_shutdown() is called.
class Extension(omni.ext.IExt):
    # ext_id is current extension id. It can be used with extension manager to query additional information, like where
    # this extension is located on filesystem.
    def on_startup(self, ext_id):
        print("[sap.configurator.viewer.messaging] SAP Configurator Messaging startup")

        self._is_external_update = False     # flag to check for messaging self-loop

        self._settings = carb.settings.get_settings()

        # -- register for bi-directional events/messages
        messaging.register_event_type_to_send("primChanged")

        event_stream = omni.usd.get_context().get_stage_event_stream()
        self._stage_sub = event_stream.create_subscription_to_pop(self._on_stage_event)

        self._input = carb.input.acquire_input_interface()
        self._input_sub_id = self._input.subscribe_to_input_events(self._on_input_event, order=0)

        self._select_event_sub = omni.kit.app.get_app().get_message_bus_event_stream().create_subscription_to_pop(
            self._on_select_prim, name="selectPrim"
        )

    def _on_input_event(self, event: carb.input.InputEvent, *_):
        if event.deviceType == carb.input.DeviceType.KEYBOARD:
            use_hotkeys = self._settings.get_as_bool("/omni/kit/hotkey/core/hotkeys_enabled")
            print(f"**** hotkeys_enabled={use_hotkeys}")
            if use_hotkeys:
                eei = event.event.input
                eet = event.event.type
                print(f"**** hotkeys_enabled={eei}")
                print(f"**** hotkeys_enabled={eet}")
                if eei == carb.input.KeyboardInput.Y:
                    if eet == carb.input.KeyboardEventType.KEY_PRESS:
                        pass
                    if eet == carb.input.KeyboardEventType.KEY_RELEASE:
                        pass

    def _on_select_prim(self, event: carb.events.IEvent) -> None:
        if event.type == carb.events.type_from_string("selectPrim") and "backdrop" in event.payload:
            prim = event.payload["backdrop"]
            print(f"**** Selection changing: Path to USD prims to select = {prim}")
            self._is_external_update = True
            sel = omni.usd.get_context().get_selection()
            sel.clear_selected_prim_paths()
            sel.set_selected_prim_paths([prim], True)

    async def _disable_enable_widget_ext(self):
        extmgr = omni.kit.app.get_app().get_extension_manager()
        if extmgr:
            extmgr.set_extension_enabled_immediate("omni.example.ui_scene.widget_info", False)
            for i in range(3):
                await omni.kit.app.get_app().next_update_async()  # type: ignore
            extmgr.set_extension_enabled_immediate("omni.example.ui_scene.widget_info", True)

    def _on_stage_event(self, event):
        if event.type == int(omni.usd.StageEventType.OPENED):
            print("***** omni.usd.StageEventType.OPENED.")
            pass
        elif event.type == int(omni.usd.StageEventType.ASSETS_LOADED):
            print("***** omni.usd.StageEventType.ASSETS_LOADED.")
            asyncio.ensure_future(self._disable_enable_widget_ext())
            pass
        elif event.type == int(omni.usd.StageEventType.CLOSING):
            print("***** omni.usd.StageEventType.CLOSING.")
            pass
        elif event.type == int(omni.usd.StageEventType.SELECTION_CHANGED):
            print("***** omni.usd.StageEventType.SELECTION_CHANGED.")
            if self._is_external_update:
                self._is_external_update = False
            else:
                message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
                event_type = carb.events.type_from_string("primChanged")
                payload = {"selectedPrims": omni.usd.get_context().get_selection().get_selected_prim_paths()}   # JSON message
                message_bus.dispatch(event_type, payload=payload)
                message_bus.pump()
                print(f"**** Selection changed: Path to USD prims currently selected = {omni.usd.get_context().get_selection().get_selected_prim_paths()}")
                print(f"*****    sending 'primChanged' event over message bus with payload={payload}")

    def on_shutdown(self):
        print("[sap.configurator.viewer.messaging] SAP Configurator Messaging shutdown")
        self._select_event_sub = None
        self._stage_sub = None
        if self._input_sub_id is not None:
            self._input.unsubscribe_to_input_events(self._input_sub_id)
            self._input_sub_id = None
