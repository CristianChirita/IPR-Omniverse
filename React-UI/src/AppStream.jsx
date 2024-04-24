/**
 * @file      : AppStream.jsx
 * @summary   : This is the component that manages the app stream.
 * @author    : Charles Best <cbest@nvidia.com>
 * @created   : 2023-12-14
 * @copywrite : 2023 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * @exports   : AppStream
 */

import React from "react";
import PropTypes from 'prop-types';

import PlaceholderImage from './assets/purse.png';
// import AppStreamer from '../../web-streaming-library/src/AppStreamer';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

export default class AppStream extends React.Component {
    constructor(props) {
        super(props);

        this._requested = false;
        this.state      = {
            streamReady : false
        };
    }

    /**
     * @function componentDidMount
     *
     * Once the React component has mounted, we start the stream.
     */
    componentDidMount() {
        if ( !this._requested ) {
            this._requested = true;

            let streamConfig = {};

            if ( this.props.streamConfig.source === 'gfn' ) {
                streamConfig = this.props.streamConfig;
            }
            if ( this.props.streamConfig.source === 'local' ) {
                // No login necessary - pass back a dummy user to the window.
                this.props.onLoggedIn('localUser');

                // Pack the local-specific config.
                const server = this.props.streamConfig.server;
                const width  = 1920;
                const height = 1080;
                const fps    = 60;
                const url    =
                    `server=${server}&resolution=${width}:${height}&fps=${fps}&mic=0&cursor=free&autolaunch=true`

                streamConfig = {
                    source           : 'local',
                    videoElementId   : 'remote-video',
                    audioElementId   : 'remote-audio',
                    messageElementId : 'message-display',
                    urlLocation      : {search: url}
                };
            }

            try {
                AppStreamer.setup({
                    streamConfig : streamConfig,
                    onUpdate     : (message) =>this._onUpdate(message),
                    onStart      : (message) =>this._onStart (message),
                    onCustomEvent: (message) =>this._onCustomEvent (message)
                })
                .then((result) => {
                    console.info(result);
                })
                .catch((error) => {
                    console.error(error);
                });
            }
            catch ( error ) {
                console.error(error);
            }
        }
    }

    /**
     * @function componentDidUpdate
     *
     * We use the update cycle to workaround cases where autoplay fails, so
     * we force the stream to play.
     *
     * @param {*} prevProps 
     * @param {*} prevState 
     * @param {*} snapshot 
     */
    componentDidUpdate(prevProps, prevState, snapshot) {
        if ( prevState.streamReady === false && this.state.streamReady === true ) {
            //
            // The stream has just become ready - make sure that the stream is playing
            //
            const player = document.getElementById("gfn-stream-player-video");

            if ( player ) {
                player.tabIndex    = "-1";
                player.playsInline = true;
                player.muted       = true;

                player.play();
            }
        }
    }

    /**
     * @function sendMessage
     * @static
     *
     * To be called from the owning window that handles the selection
     * controls. Passess the request down to the underlying stream.
     *
     * @param {*} state 
     * @param {*} storeSelection 
     */
    static sendMessage(message, storeSelection) {
        AppStreamer.sendMessage(
            message,
            storeSelection
        );
    }

    /**
     * @function _onStart
     *
     * Call back for onStart messages from the stream.
     */
    _onStart(message) {
        if ( message.action === 'start' && message.status === 'success' && !this.state.streamReady ) {
            //
            // The stream just became ready - update state to unhide the video element.
            //
            console.info('streamReady');
            this.setState({streamReady: true});
            this.props.onStarted();
        }

        console.debug(message);
    }

    /**
     * @function _onUpdate
     *
     * Callback for all non-start messaging from the stream.
     *
     * @param {*} message 
     */
    _onUpdate(message) {
        try {
            if ( message.action === 'authUser' && message.status === 'success' ) {
                // The user has successfully logged in.
                this.props.onLoggedIn(message.info);
            }
        }
        catch ( error ) {
            console.error(message);
        }

    }

    _onCustomEvent(message) {
        this.props.handleCustomEvent(message)
    }

    render() {
        if ( this.props.streamConfig.source === 'gfn' ) {
            return (
                <div
                    id    = "view"
                    style = {{
                        backgroundColor : '#dddddd',
                        display: 'flex', justifyContent: 'space-between',
                        ...this.props.style
                    }}
                />
            );
        }
        else if ( this.props.streamConfig.source === 'local' ) {
            return (
                <div
                    key   = {'stream-canvas'}
                    id    = {'main-div'}
                    style = {{
                        backgroundColor : '#dddddd',
                        visibility      : this.state.streamReady ? 'visible' : 'hidden',
                        ...this.props.style
                    }}
                >
                    <video
                        key      = {'video-canvas'}
                        id       = {'remote-video'}
                        style    = {{
                            position : 'absolute',
                            left     : 0,
                            top      : 0,
                            width    : '100%',
                            height   : '100%',
                        }}
                        // poster   = {PlaceholderImage}
                        tabIndex = "-1"
                        playsInline muted
                        autoPlay
                    />
    
                    {/* We don't want these, but currently can't pass null to the ragnok framework. */}
                    <audio id="remote-audio" muted></audio>
                    <h3 style={{visibility: 'hidden'}} id="message-display">...</h3>
                </div>
            );
        }

        return null;
    }
}

AppStream.propTypes = {
    streamConfig : PropTypes.object.isRequired,
    onLoggedIn   : PropTypes.func.isRequired,
    onStarted    : PropTypes.func.isRequired,
    style        : PropTypes.shape({
        top      : PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        left     : PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        height   : PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        width    : PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
    }).isRequired
}

AppStream.defaultProps = {
}
