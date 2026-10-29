import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-6xl">🥛</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-1 text-gray-500">The page you are looking for doesn't exist.</p>
        <Link href="/" className="btn-primary mt-5">Go home</Link>
      </div>
    </div>
  );
}
