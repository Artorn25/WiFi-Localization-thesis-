import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          Seem like the page you are looking for has been removed or moved.
        </p>
        <Link href="/">
          <span className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
            ฺBack to Home
          </span>
        </Link>
      </div>
    </div>
  );
}
