/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fondo oscuro romántico
        bg: '#1A1015',
        bgCard: 'rgba(30, 18, 22, 0.85)',
        // Paleta cálida
        coral: '#FF6B6B',
        coralDark: '#FF4D6D',
        pink: '#FF8FA3',
        peach: '#FFB4A2',
        gold: '#FFD6A5',
        // Textos
        textPrimary: '#FFF0F3',
        textSecondary: '#D4A5B0',
        textMuted: '#8A6070',
      },
      fontFamily: {
        display: ['Fraunces_400Regular'],
        displayBold: ['Fraunces_700Bold'],
        body: ['Nunito_400Regular'],
        bodyBold: ['Nunito_700Bold'],
        bodySemiBold: ['Nunito_600SemiBold'],
      },
    },
  },
  plugins: [],
};
