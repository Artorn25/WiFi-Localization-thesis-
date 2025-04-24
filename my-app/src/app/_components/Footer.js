export default function Footer() {
  const footerNavs = [
    { href: "javascript:void()", name: "Terms" },
    { href: "javascript:void()", name: "License" },
    { href: "javascript:void()", name: "Privacy" },
    { href: "javascript:void()", name: "About us" },
  ];

  return (
    <footer className="mt-5 pt-10 bg-blue-700 text-white">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="space-y-6 sm:max-w-md sm:mx-auto sm:text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-8 h-8 text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
            <h3 className="text-xl font-bold sm:text-2xl">WiFi Localization</h3>
          </div>
          <p className="text-blue-100">
            Precision indoor positioning technology using WiFi signals
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-blue-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Location Tracking</span>
            </div>

            <div className="flex items-center gap-2 text-blue-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>

        <div className="mt-10 py-10 border-t border-blue-600 items-center justify-between sm:flex">
          <p className="text-blue-100">
            © 2025 WiFi Localization Inc. All rights reserved.
          </p>

          <ul className="flex flex-wrap items-center gap-4 mt-6 sm:text-sm sm:mt-0">
            {footerNavs.map((item) => (
              <li
                key={item.name}
                className="text-white hover:text-blue-200 duration-150"
              >
                <a href={item.href}>{item.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
