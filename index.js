import { InstanceBase, Regex, runEntrypoint } from '@companion-module/base'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import UpgradeScripts from './upgrades.js'

import OSC from 'osc'

class MittiInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus('connecting', 'Connecting')

		this.initActions()
		this.initPresets()
		this.initVariables()
		this.initFeedbacks()

		if (this.config.host) {
			this.initOSC()
		} else {
			this.updateStatus('bad_config', 'Missing IP Address')
		}
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'IP Address',
				tooltip: 'The IP of the computer running Powerpoint',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'feedbackPort',
				label: 'Feedback Port',
				width: 5,
				tooltip: 'The port designated for Feedback in the OSC/UDP Controls tab in PPT-OSC',
				default: 35551,
				regex: Regex.PORT,
			},
		]
	}

	async configUpdated(config) {
		this.config = config

		this.initPresets()
		this.initVariables()
		this.initFeedbacks()
		this.initOSC()
	}

	async destroy() {
		if (this.listener) {
			this.listener.close()
		}

		
	}

	initVariables() {
		const variables = getVariables.bind(this)()
		this.setVariableDefinitions(variables)
	}

	initFeedbacks() {
		const feedbacks = getFeedbacks.bind(this)()
		this.setFeedbackDefinitions(feedbacks)
	}

	initPresets() {
		const presets = getPresets.bind(this)()
		this.setPresetDefinitions(presets)
	}

	initActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	sendCommand(command, value) {
		if (value || value === 0) {
			this.oscSend(this.config.host, 35550, `${command}`, [
				{
					type: 's',
					value: value,
				},
			])
		} else {
			this.oscSend(this.config.host, 35550, `${command}`, [])
		}
	}


	initOSC() {
		this.updateStatus('ok')

		this.cues = {}
		this.states = {}

		if (this.listener) {
			this.listener.close()
		}

		this.listener = new OSC.UDPPort({
			localAddress: '0.0.0.0',
			localPort: this.config.feedbackPort,
			broadcast: true,
			metadata: true,
		})

		this.listener.open()
		this.listener.on('ready', () => {
			this.sendCommand('/resendOSCFeedback')
		})
		this.listener.on('error', (err) => {
			if (err.code == 'EADDRINUSE') {
				this.log('error', `Error: Selected feedback port ${err.message.split(':')[1]} is already in use.`)
				this.updateStatus('bad_config', 'Feedback port conflict')
			}
		})

		this.listener.on('message', (message) => {
			let value = message?.args[0]?.value

			if (message.address === '/currentSlide') {
				this.states.currentSlide = value
				this.setVariableValues({ currentSlide: value != '-' ? value : 'None' })

			} else if (message.address === '/totalSlides') {
				this.states.totalSlides = value
				this.setVariableValues({ totalSlides: value != '-' ? value : 'None' })

			}
		})
	}
}
runEntrypoint(MittiInstance, UpgradeScripts)
