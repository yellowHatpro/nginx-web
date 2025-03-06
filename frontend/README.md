# Nginx Manager Frontend

This is the frontend for the Nginx Manager application. It's built with React, TailwindCSS, and ReactFlow.

## Features

- **Traffic Dashboard**: Monitor Nginx ingress traffic with detailed information
- **Load Balancer Configuration**: Visual drag-and-drop interface for configuring Nginx load balancing
- **Config Manager**: User-friendly interface for managing Nginx configuration files

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   pnpm install
   ```

2. Create a `.env` file in the frontend directory with the following content:

   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. Run the development server:

   ```
   npm run dev
   ```

   or

   ```
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To build the frontend for production, run:

```
npm run build
```

or

```
pnpm build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/components`: React components
- `src/App.tsx`: Main application component
- `src/main.tsx`: Entry point

## Components

### TrafficDashboard

The TrafficDashboard component displays Nginx ingress traffic with filtering and search capabilities.

### LoadBalancer

The LoadBalancer component provides a visual drag-and-drop interface for configuring Nginx load balancing.

### ConfigManager

The ConfigManager component provides a user-friendly interface for managing Nginx configuration files.
