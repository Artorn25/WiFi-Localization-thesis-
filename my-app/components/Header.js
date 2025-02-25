import Link from "next/link";

export default function Header() {
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
    <>
      <div className="sidebar oswald-bold">
        <ul className="menu-list">
          <li>
            <Link href="/map">Maps</Link>
          </li>
          <li>
            <Link href="/wifi">Free Wifi</Link>
          </li>
          <li>
            <Link href="/wifi-router">Wifi Router</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/setting">Setting</Link>
          </li>
          <li>
            <Link href="/feedback">Feedback</Link>
          </li>
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
        </ul>
      </div>
    </>
  );
}
