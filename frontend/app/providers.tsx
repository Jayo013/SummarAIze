"use client";

import { Auth0Provider } from "@auth0/auth0-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN!;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE!;
  const redirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience,
        redirect_uri: redirectUri,
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
