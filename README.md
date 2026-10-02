# Weather Forecasting App

A React + Vite weather dashboard that shows current conditions and a 5-day forecast using the OpenWeatherMap API.

## Features

- Search weather by city
- Displays current temperature, feels-like temperature, humidity, wind, and condition
- Includes sunrise and sunset times
- Shows a 5-day forecast
- Falls back to demo sample data when the API key is missing or invalid

## Tech Stack

- React
- Vite
- OpenWeatherMap API
- JavaScript

## Prerequisites

Before running the app, make sure you have:

- Node.js installed
- npm installed
- An OpenWeatherMap API key

## Setup

1. Clone the repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env.local` file in the project root.
5. Add your API key:

   ```env
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open the local Vite URL shown in the terminal.

## API Key

To get an API key:

1. Visit https://openweathermap.org/api
2. Sign up or log in
3. Generate an API key
4. Paste it into `.env.local`

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run mobile
npm run mobile:android
npm run mobile:ios
npm run mobile:web
npm run mobile:login
```

## Mobile App

The Expo app in `mobile/` runs on Android and iOS while the Vite web app remains available at the repository root.

1. Install mobile dependencies with `npm --prefix mobile install`.
2. Create `mobile/.env.local` with your OpenWeatherMap key:

   ```env
   EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

3. Start Expo from the repository root with `npm run mobile`, then scan the QR code with Expo Go. Use `npm run mobile:android` for an Android emulator. Building or running the iOS simulator requires macOS; an iPhone can use Expo Go.

Use `npm run mobile:login` to sign in to Expo from the repository root when an Expo account is needed. Expo Go local development does not require an account.

The `EXPO_PUBLIC_` key is bundled into the client app and is visible to its users. Restrict the key in your OpenWeatherMap account. Without a valid key, the app displays sample conditions.

## Notes

- If the API key is missing or invalid, the app automatically shows sample weather data so the interface remains usable.
- The production build can be generated with `npm run build`.

## License

This project is for educational/demo use.
