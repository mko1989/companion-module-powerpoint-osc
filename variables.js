export function getVariables() {
	const variables = []

	//Standard Variables
	variables.push({
		name: 'Current Slide',
		variableId: 'currentSlide',
	})

	variables.push({
		name: 'Total Slides',
		variableId: 'totalSlides',
	})

	this.setVariableValues({
		currentSlide: '0',
		totalSlides: '0',
	})


	return variables
}
