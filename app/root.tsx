import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";

// 🔴 ADD THESE 2 LINES
import type { LinksFunction } from "react-router";
import appStylesHref from "./app.css?url";

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

// Define AuthContext type
interface AuthContextType {
  isSignedIn: boolean;
  userName?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading?: boolean;
}

// 🔴 ADD THIS FUNCTION
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links /> {/* This will now include your CSS */}
        {/* Puter SDK script */}
        <script src="https://js.puter.com/v2/" async></script>
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

  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for Puter to load
        setTimeout(async () => {
          if (window.puter?.auth) {
            const signedIn = await window.puter.auth.isSignedIn();
            setIsSignedIn(signedIn);
            
            if (signedIn) {
              const user = await window.puter.auth.getUser();
              setUserName(user?.username || user?.name || user?.email || 'User');
            }
          }
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign in function
  const signIn = async () => {
    try {
      if (window.puter?.auth) {
        const user = await window.puter.auth.signIn();
        setIsSignedIn(true);
        setUserName(user?.username || user?.name || user?.email || 'User');
      } else {
        alert("Puter SDK not loaded. Please refresh the page.");
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

  // Provide context to children
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