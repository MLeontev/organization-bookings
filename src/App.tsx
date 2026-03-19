import { useEffect, useState } from 'react';
import keycloak from './keycloak';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
type ApiState = 'idle' | 'loading' | 'success' | 'error';

type MyProfile = {
  id: string;
  identityId: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
};

function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [username, setUsername] = useState<string>('');
  const [apiState, setApiState] = useState<ApiState>('idle');
  const [apiError, setApiError] = useState<string>('');
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMyProfile = async () => {
      setApiState('loading');
      setApiError('');

      try {
        await keycloak.updateToken(30);

        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${text || response.statusText}`,
          );
        }

        const profile = (await response.json()) as MyProfile;
        if (!mounted) {
          return;
        }

        setMyProfile(profile);
        setApiState('success');
      } catch (error) {
        console.error('API call /api/users/me failed:', error);
        if (mounted) {
          setApiState('error');
          setApiError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    const bootstrapAuth = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          pkceMethod: false,
          checkLoginIframe: false,
        });

        if (!mounted) {
          return;
        }

        if (authenticated) {
          setUsername(keycloak.tokenParsed?.preferred_username ?? '');
          setAuthState('authenticated');
          await fetchMyProfile();
          return;
        }

        setAuthState('unauthenticated');
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        if (mounted) {
          setAuthState('unauthenticated');
        }
      }
    };

    void bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    await keycloak.login();
  };

  const handleLogout = async () => {
    await keycloak.logout({ redirectUri: window.location.origin });
  };

  if (authState === 'loading') {
    return (
      <main>
        <h1>Organization Bookings</h1>
        <p>Checking authorization...</p>
      </main>
    );
  }

  if (authState === 'unauthenticated') {
    return (
      <main>
        <h1>Organization Bookings</h1>
        <p>Sign in with Keycloak to continue.</p>
        <button onClick={handleLogin}>Login with Keycloak</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Organization Bookings</h1>
      <p>You are logged in.</p>
      <p>{username ? `User: ${username}` : 'User profile loaded.'}</p>
      {apiState === 'loading' && <p>Calling /api/users/me...</p>}
      {apiState === 'success' && myProfile && (
        <p>
          API OK: {myProfile.firstName} {myProfile.lastName} ({myProfile.email})
        </p>
      )}
      {apiState === 'error' && <p>API error: {apiError}</p>}
      <button onClick={handleLogout}>Logout</button>
    </main>
  );
}

export default App;
