"use client"; // ระบุว่าเป็น Client Component

import { useRouter } from "next/navigation";

export default function SearchForm() {
  const router = useRouter();

  function searchPage(event) {
    event.preventDefault();
    const searchQuery = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const pages = {
      maps: "/map",
      "free wifi": "/wifi",
      "wifi router": "/wifi-router",
      dashboard: "/dashboard",
      setting: "/setting",
      feedback: "/feedback",
    };

    for (const page in pages) {
      if (page.includes(searchQuery)) {
        router.push(pages[page]);
        return;
      }
    }

    alert("No matching page found.");
  }

  return (
    <form
      className="d-flex text-black input-group w-auto search-bar"
      onSubmit={searchPage}
    >
      <input
        id="searchInput"
        type="search"
        className="form-control search-input"
        placeholder="Search for maps"
      />
      <button className="btn btn-warning search-button" type="submit">
        Search
      </button>
    </form>
  );
}