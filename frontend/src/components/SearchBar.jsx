// Controlled filters: Products.jsx owns the values and fetches results when they change.
export default function SearchBar({ search, setSearch, category, setCategory, sort, setSort }) {
  return (
    <div className="filters">
      <label>Search<input placeholder="Search products..." value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label>Category
        <select aria-label="Category" value={category} onChange={event => setCategory(event.target.value)}>
          {/* An empty category value asks the backend for all categories. */}
          <option value="">All Categories</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Books</option>
          <option>Home</option>
        </select>
      </label>
      <label>Sort by
        <select aria-label="Sort by" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="">Default order</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </label>
    </div>
  );
}
