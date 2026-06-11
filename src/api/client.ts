import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// When the backend's optional config API key is enabled, send it on requests. Note: a key
// embedded in a public SPA is not strong security (it is visible to the user); it only matches
// the backend's "defense in depth" toggle. Real protection would require login.
const configApiKey = import.meta.env.VITE_CONFIG_API_KEY;
if (configApiKey) {
  apiClient.defaults.headers.common['X-Api-Key'] = configApiKey;
}
