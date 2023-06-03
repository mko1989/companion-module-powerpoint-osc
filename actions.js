export function getActions() {
	let actions = {
		play: {
			name: 'Next',
			options: [],
			callback: () => {
				this.sendCommand('/next')
			},
		},
		toggle_play: {
			name: 'Previous',
			options: [],
			callback: () => {
				this.sendCommand('/previous')
			},
		},
	}
	return actions
}
