import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  // Return 404 for any unknown routes (including Chrome DevTools paths)
  return new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}