import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8082',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'organization-bookings',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'bookings-public-client',
});

export default keycloak;
