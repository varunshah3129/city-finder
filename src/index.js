import React from 'react';
import ReactDOM from 'react-dom';
import App from './App'; // Assuming your main app component is named 'App'
import config from './config';

// Load Google Maps API here
const googleScript = document.createElement('script');
googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleApiKey}&libraries=places`;
googleScript.async = true;

const rootElement = document.getElementById('root');

// Instead of waiting for script.onload, use React 18 concurrent mode
// to start rendering the app as soon as the resources are available
const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

document.head.appendChild(googleScript);
