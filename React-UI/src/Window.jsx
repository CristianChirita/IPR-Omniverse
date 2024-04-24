/**
 * @file      : Window.jsx
 * @summary   : 
 * @author    : Charles Best <cbest@nvidia.com>
 * @created   : 2023-12-14
 * @copywrite : 2023 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * @exports   : Window
 */

import React from 'react';
import './App.css';
import ColorControls from './ColorControls.jsx';
import BackgroundControls from './BackgroundControls.jsx';
import AppStream from './AppStream.jsx';
import InfoCard from './InfoCard.jsx';
import StreamConfig from '../stream.config.json';

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            setColor    : '',
            setBackdrop : '',
            gfnUser     : null,   // User is authenticated
            streamReady : false,   // Stream is ready to display
            label: ''
        }
    }

    /**
     * @function _onStreamStarted
     *
     * Pulls all user-selected values from localStorage and passes them to
     * the streaming application.
     */
    _onStreamStarted() {
        const states = JSON.parse(localStorage.getItem('states') || '[]');

        states.forEach(state => {
            // The user had a previous session. Make request to set kit app state.
            const message = this._generateCustomMessageFromState(state);
            this.setState(
                {[state.event]: state.value},
                () => AppStream.sendMessage(message)
            );
        });
    }

    /**
     * @function _generateCustomMessageFromState
     *
     * Converts state to the custom configurator purse example event
     * structure.
     *
     *  NOTE: This structure must be modified to work with other custom
     *        sample action graph setups.
     *
     * @param   {string} state
     * @returns {*}
     */
    _generateCustomMessageFromState(state) {
        return JSON.stringify({
            event_type : state.event,
            payload    : {
                [state.attributeName]: state.value
            }
        });
    }

    /**
     * @function _onSelected
     *
     * Writes the input state into the localStorage states list.
     *
     * @param {*} state 
     */
    _onSelected(state) {
        const storeSelection = () => {
            // Adds the input state localStorage.states.

            const states  = JSON.parse(localStorage.getItem('states') || '[]');
            const currVal = states.findIndex(item => item.event === state.event);

            if ( currVal > -1 ) {
                states[currVal] = state;
            }
            else {
                states.push(state);
            }

            localStorage.setItem('states', JSON.stringify(states));
        }

        this.setState(
            {[state.event]: state.value},
            () => AppStream.sendMessage(
                this._generateCustomMessageFromState(state),
                storeSelection
            )
        );
    }

    /**
     * @function _onSelectColor
     *
     * Updates the object color state and notifies
     * the GFN stream.
     *
     * @param {string} option 
     */
    _onSelectColor(option) {
        const state = {
            event         : 'setColor',
            attributeName : 'color',
            value         : option
        };

        this._onSelected(state);
    }

    /**
     * @function _onSelectBackground
     *
     * Updates the object background state and notifies
     * the GFN stream.
     *
     * @param {string} option 
     */
    _onSelectBackground(option) {
        const state = {
            event         : 'setBackdrop',
            attributeName : 'backdrop',
            value         : option
        };

        this._onSelected(state);
    }

    _handleCustomEvent(event){
        console.log("onCustomEvent");
        console.log(event);
        if(!event){
            return;
        }
        //messages from kit to app
        if(event.event_type === "primChanged"){
            console.log('Kit App communicates stage selection: ' + event.payload?.selectedPrims[0])
            this.setState({label: event.payload?.selectedPrims[0]})
        }
        //messages from kit to app
        else if(event.event_type === "setColorResponse"){
            console.log('Kit App confirms color selection: ' + event.payload?.color)
            this.state.setColor = event.payload?.color
        }
        //messages from kit to app
        else if(event.event_type === "setBackdropResponse") {
            console.log('Kit App confirms backdrop selection: ' + event.payload?.backdrop)
            this.state.setBackdrop = event.payload?.backdrop
        }
        //messages from app to kit
        else if (event.messageRecipient === "kit") {
            console.log(JSON.parse(event.data).event_type)
        }
    }

    render() {
        const sidebarWidth = 250;
        const streamConfig = StreamConfig.source === 'gfn' ? {
            ...StreamConfig[StreamConfig.source],
            source: StreamConfig.source,
            GFN: GFN
        } : {
            ...StreamConfig[StreamConfig.source],
            source: StreamConfig.source
        };


        return (
            <div
                style = {{
                    background: '#444444',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                }}
            >
                <AppStream
                    streamConfig = {streamConfig}
                    onLoggedIn   = {(userId)=>this.setState({gfnUser: userId})}
                    onStarted    = {()=>this._onStreamStarted()}
                    style        = {{
                        position   : 'absolute',
                        left       : 0,
                        top        : 0,
                        height     : '100%',
                        width      : `calc(100% - ${sidebarWidth}px)`,
                        visibility : this.state.gfnUser ? 'visible' : 'hidden'
                    }}
                    handleCustomEvent={(event)=>this._handleCustomEvent(event)}
                />
                {this.state.gfnUser &&
                    <>
                        <BackgroundControls
                            width    = {`calc(100% - ${sidebarWidth}px)`}
                            options  = {[{label: 'TEST', value: 'Test'}, {label: 'PLINTHS', value: 'Plinths'}, {label: 'DESK', value: 'Desk'}, {label: 'MARBLE WALL', value: 'MarbleWall'}]}
                            selected = {this.state.setBackdrop}
                            onSelect = {(value) => this._onSelectBackground(value)}
                        />
                        <ColorControls
                            width    = {sidebarWidth}
                            options  = {[{label: 'WHITE', value: 'White'}, {label: 'BLACK', value: 'Black'}, {label: 'PINK', value: 'Pink'}]}
                            selected = {this.state.setColor}
                            onSelect = {(value) => this._onSelectColor(value)}
                        />
                        <InfoCard
                            title = {this.state.label || 'Try selecting something in USD Stage'}
                        />
                    </>
                }
            </div>
        );
    }
}
