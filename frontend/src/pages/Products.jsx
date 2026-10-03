import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { api } from '../services/api';

// Fetch and display the product list from the backend.
export default function Products() {
  const { wishlist, loading: wishlistLoading, error: wishlistError, refreshWishlist, changeWishlist } = useOutletContext();
  // Store the API results, selected filters and request status.
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Fetch again whenever the search text or selected category changes.
  useEffect(() => {
    // Cancel the previous request so an old result cannot replace a newer search.
    const controller = new AbortController();
    // Encode search and category safely into the request URL.
    const query = new URLSearchParams({ search, category, sort });
    api(`/products?${query}`, { signal: controller.signal }).then(data => {
      setProducts(data.products);
    }).catch(error => {
      if (error.name !== 'AbortError') setError('Something went wrong while loading products.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    // Cleanup runs when filters change or the user leaves the page.
    return () => controller.abort();
  }, [search, category, sort]);
  // Show the matching products, or a loading, error or empty message.
  return (
    <>
      <main>
        <header className="page-heading"><div><p className="eyebrow">The everyday collection</p><h1>Products</h1><p className="intro">Find something that feels like you.</p></div><span className="page-note">Explore. Save. Make it yours.</span></header>
        {wishlistError && <div role="alert"><p className="error">{wishlistError}</p><button onClick={refreshWishlist}>Retry Wishlist</button></div>}
        {/* Changing a filter shows loading immediately and clears the previous error. */}
        <SearchBar search={search} setSearch={value => { setLoading(true); setError(''); setSearch(value); }} category={category} setCategory={value => { setLoading(true); setError(''); setCategory(value); }} sort={sort} setSort={value => { setLoading(true); setError(''); setSort(value); }} />
        {loading ? <div className="loading-state" role="status"><span className="spinner" />Loading products...</div> : error ? <p className="error" role="alert">{error}</p> : products.length === 0 ? <div className="empty-state"><h2>No products found.</h2><p>Try a different search or category.</p>{(search || category) && <button className="button-secondary" onClick={() => { setLoading(true); setError(''); setSearch(''); setCategory(''); }}>Clear filters</button>}</div> : (
          /* Render a card for each API result; _id gives React a stable key. */
          <div className="products">{products.map(product => <ProductCard key={product._id} product={product}
            saved={wishlist.some(item => item._id === product._id)} onWishlistChange={changeWishlist}
            wishlistDisabled={wishlistLoading || !!wishlistError} />)}</div>
        )}
      </main>
    </>
  );
}
