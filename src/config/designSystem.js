// Central color tokens and small helpers used across the app
export const colors = {
	brand: {
		orange: '#ff8200',
		orangeHover: '#e57400',
	},
	status: {
		blue: 'bg-blue-600 hover:bg-blue-700 text-white',
		green: 'bg-green-600 hover:bg-green-700 text-white',
		red: 'bg-red-600 hover:bg-red-700 text-white',
		yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
		orange: 'bg-[#ff8200] hover:bg-[#e57400] text-white'
	},
};

// Utility to pick classes based on dark mode boolean
export function pickByMode(isDark, lightCls, darkCls) {
	return isDark ? darkCls : lightCls;
}

// Prop helper: prefer $isDarkMode alias when present
export function resolveDarkMode(props) {
	if (typeof props?.$isDarkMode === 'boolean') return props.$isDarkMode;
	return !!props?.isDarkMode;
}
