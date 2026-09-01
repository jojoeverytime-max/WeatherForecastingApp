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
```

## Notes

- If the API key is missing or invalid, the app automatically shows sample weather data so the interface remains usable.
- The production build can be generated with `npm run build`.

## License

This project is for educational/demo use.
