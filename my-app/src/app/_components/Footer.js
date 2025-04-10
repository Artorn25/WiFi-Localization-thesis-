import Image from "next/image";

export default function Footer() {
  const footerNavs = [
    { href: "javascript:void()", name: "Terms" },
    { href: "javascript:void()", name: "License" },
    { href: "javascript:void()", name: "Privacy" },
    { href: "javascript:void()", name: "About us" },
  ];

  return (
    <footer className="pt-10">
      <div className="max-w-screen-xl mx-auto px-4 text-gray-600 md:px-8">
        <div className="space-y-6 sm:max-w-md sm:mx-auto sm:text-center">
          {/* Content seems to be missing here - consider adding some content */}
        </div>
        
        <div className="mt-10 py-10 border-t items-center justify-between sm:flex">
          <p>© 2025 WiFi localization Inc. All rights reserved.</p>
          
          <ul className="flex flex-wrap items-center gap-4 mt-6 sm:text-sm sm:mt-0">
            {footerNavs.map((item) => (
              <li
                key={item.name}
                className="text-gray-800 hover:text-gray-500 duration-150"
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