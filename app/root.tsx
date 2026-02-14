import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* ✅ YEH IMPORTANT HAI - Puter SDK script add karo */}
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
  // Debug - check if Puter loaded
  useEffect(() => {
    setTimeout(() => {
      console.log("Puter loaded?", !!window.puter);
    }, 2000);
  }, []);

  return <Outlet />;
}