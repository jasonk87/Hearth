import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { setAccessToken, getProfile } from '../services/authService';

interface GoogleAuthProps {
  setProfile: (profile: any) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ setProfile }) => {
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      alert(`Granted Scopes: ${codeResponse.scope || 'none'}`);
      setAccessToken(codeResponse.access_token);
      getProfile().then(setProfile);
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  return (
    <button onClick={() => login()} className="text-sm font-medium text-slate-600 hover:text-slate-900">
      Sign in with Google 🚀
    </button>
  );
};

export default GoogleAuth;
