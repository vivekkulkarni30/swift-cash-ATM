import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// ATM-specific colors
				atm: {
					primary: 'hsl(var(--atm-primary))',
					'primary-light': 'hsl(var(--atm-primary-light))',
					'primary-dark': 'hsl(var(--atm-primary-dark))',
					screen: 'hsl(var(--atm-screen))',
					'screen-text': 'hsl(var(--atm-screen-text))',
					button: 'hsl(var(--atm-button))',
					'button-hover': 'hsl(var(--atm-button-hover))',
					success: 'hsl(var(--atm-success))',
					error: 'hsl(var(--atm-error))',
					warning: 'hsl(var(--atm-warning))',
					white: 'hsl(var(--atm-white))',
					black: 'hsl(var(--atm-black))',
					gray: {
						100: 'hsl(var(--atm-gray-100))',
						200: 'hsl(var(--atm-gray-200))',
						300: 'hsl(var(--atm-gray-300))',
						500: 'hsl(var(--atm-gray-500))',
						700: 'hsl(var(--atm-gray-700))',
						800: 'hsl(var(--atm-gray-800))',
						900: 'hsl(var(--atm-gray-900))'
					}
				}
			},
			backgroundImage: {
				'gradient-atm': 'var(--gradient-atm)',
				'gradient-screen': 'var(--gradient-screen)'
			},
			boxShadow: {
				'atm': 'var(--shadow-atm)',
				'atm-button': 'var(--shadow-button)',
				'atm-screen': 'var(--shadow-screen)'
			},
			transitionProperty: {
				'atm': 'var(--transition-atm)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
