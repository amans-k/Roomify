export {};

declare global {
  interface Window {
    puter?: {
      auth: {
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<{
          username?: string;
          email?: string;
          name?: string;
        }>;
        signOut: () => Promise<void>;
        getUser: () => Promise<{
          username?: string;
          email?: string;
          name?: string;
        }>;
      };
    };
  }
  
  interface AuthContext {
    isSignedIn: boolean;
    userName?: string;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    isLoading?: boolean;
  }
}