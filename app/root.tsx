import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import type { LinksFunction } from "react-router";
import appStylesHref from "./app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

// Define types for Puter
interface PuterUser {
  username?: string;
  email?: string;
  name?: string;
}

interface PuterAuth {
  isSignedIn: () => Promise<boolean>;
  signIn: () => Promise<PuterUser>;
  signOut: () => Promise<void>;
  getUser: () => Promise<PuterUser>;
}

interface PuterSDK {
  auth: PuterAuth;
}

declare global {
  interface Window {
    puter?: PuterSDK;
  }
}

interface AuthContextType {
  isSignedIn: boolean;
  userName?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading?: boolean;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Load Puter script dynamically to avoid duplicate registry error
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://js.puter.com/v2/"]')) {
      initializePuter();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = initializePuter;
    script.onerror = () => {
      console.error("Failed to load Puter SDK");
      setIsLoading(false);
    };
    document.head.appendChild(script);

    async function initializePuter() {
      try {
        // Wait a bit for Puter to initialize
        setTimeout(async () => {
          if (window.puter?.auth) {
            try {
              const signedIn = await window.puter.auth.isSignedIn();
              setIsSignedIn(signedIn);
              
              if (signedIn) {
                const user = await window.puter.auth.getUser();
                setUserName(user?.username || user?.name || user?.email || 'User');
              }
            } catch (authError) {
              console.error("Puter auth error:", authError);
            }
          }
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Puter initialization failed:", error);
        setIsLoading(false);
      }
    }
  }, []);

  // Sign in function
  const signIn = async () => {
    try {
      if (window.puter?.auth) {
        const user = await window.puter.auth.signIn();
        setIsSignedIn(true);
        setUserName(user?.username || user?.name || user?.email || 'User');
      } else {
        console.log("Puter SDK not loaded yet");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      if (window.puter?.auth) {
        await window.puter.auth.signOut();
        setIsSignedIn(false);
        setUserName(undefined);
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <Outlet context={{ 
      isSignedIn, 
      userName, 
      signIn, 
      signOut,
      isLoading 
    } as AuthContextType} />
  );
}