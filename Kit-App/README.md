## SAP Intelligent Product RTX Experience sample

*SAP Intelligent Product RTX Experience* is a customized streaming kit app based upon the Explorer sample app in the Omniverse kit-app-template GitHub repo for a demonstration project.

## Links

* Recommended: [Tutorial](https://docs.omniverse.nvidia.com/kit/docs/kit-app-template) for
getting started with application development.
* [Developer Guide](https://docs.omniverse.nvidia.com/dev-guide/latest/index.html).


## Build

1. Clone repo, or unzip, to your local machine.
2. Open a command prompt and navigate to the root of that repo.
3. Run `build.bat` to bootstrap your dev environment and build an example app.
4. After building, run `_build\windows-x86_64\release\sap.configurator.viewer.warmup.bat` to prepare the app with navigation bar and some loading performance improvements (usually done as part of Launcher install process.)
5. Use `_build\windows-x86_64\release\sap.configurator.viewer.bat` to run the kit application.

You should have now launched your kit-based application!

* Note: Because it is tailored for streaming this app does not provide an Open dialog, therefore need to specify a USD file path or URL with app setting `app.auto_load_usd` in `source\apps\sap.configurator.viewer.kit` file.

### Application Settings

Priority list for Kit application settings:
1. command line argument   `--/persistent/app/stage/upAxis=Z`
2. then user.config.json file
```json
                "stage": {
                    "upAxis": "Z",
                    "defaultPrimName": "World",
```
3.  then .kit file
```toml
     [persistent.app]
     stage.upAxis = 'Z'
```

### Kit file changes do not appear to affect app

* Note: when making dependency or setting changes suggest rebuild using `build.bat -x` and remove `user.config.json`.

* Note: so if settings changes in 'sap.configurator.viewer.kit' file don't look correct when run the app, please remove the `user.config.json` file in `C:\Users\USER\AppData\Local\ov\data\Kit\SAP.Configurator\2024.1` folder, and rerun `sap.configurator.viewer.bat`.

## Streaming

### Web app changes

The button 'value' changes were made to kit-streaming-sample for compatibility with (default) auto loaded `cube_sphere_cone.usda` USD file.  In `main.tsx` (~line 186) only changed options values:
```json
options={['/World/Sphere', '/World/Cone', '/World/Cube']}
```

### Allow React App to set render resolution of streamed Kit App.

The Kit App's default application window size is 1920x1080 by default. A React App (or other client) can request the Kit App to use a different size.

To enable the size to be dynamic the Kit App should be launched with argument `--/app/livestream/allowResize=1`.

```
sap.configurator.viewer.bat --/app/livestream/allowResize=1
```

The Web App `AppStream.jsx` (provided as a separate example) you can change the resolution in the below section.
Here we request 3840x2160:

```javascript
// Pack the local-specific config.
const server = this.props.streamConfig.server;
const width  = 3840;
const height = 2160;
const fps    = 60;
const url    =
    `server=${server}&resolution=${width}:${height}&fps=${fps}&mic=0&cursor=free&autolaunch=true`
```

### Headless

To run the Kit App headless use `--no-window` argument.

```
sap.configurator.viewer.bat --no-window
```

### Enable streaming and messaging at startup

The `source\apps\sap.configurator.viewer.kit` file already enables WebRTC streaming.

This is achieved by adding dependencies `omni.kit.livestream.webrtc` and `omni.kit.livestream.messaging` that provide streaming and messaging capabilities.

Here's how to enable them at startup:

```
sap.configurator.viewer.bat --enable omni.kit.livestream.webrtc --enable omni.kit.livestream.messaging
```

### Debugging

The VSCode kit debugging extension (and dialog) may be enabled by default in the .kit file; to turn it off comment out the occurences of `omni.kit.debug.vscode` in the `source\apps\sap.configurator.viewer.kit` file.

### Summary

The above configurations can be combined to run the Kit App headless in streaming mode:

```
sap.configurator.viewer.bat --/app/livestream/allowResize=1 --no-window --enable omni.kit.livestream.webrtc --enable omni.kit.livestream.messaging
```

## Packaging

See [Packaging](https://docs.omniverse.nvidia.com/dev-guide/latest/dev_guide/package/package.html) section in Developer Guide for more information.

## Contributing
The source code for this repository is provided as-is and we are not accepting outside contributions.
