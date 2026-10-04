import { Link, useOutletContext } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { wishlist, loading, error, refreshWishlist, changeWishlist } = useOutletContext();
  return <main>
    <header className="page-heading"><div><p className="eyebrow">Keep the good finds close</p><h1>My Wishlist</h1><p className="intro">Your favorites, ready when you are.</p></div><Link className="button button-secondary" to="/products">Continue Shopping →</Link></header>
    {loading ? <div className="loading-state" role="status"><span className="spinner" />Loading your wishlist...</div> : error ? <div role="alert">
      <p className="error">{error}</p><button onClick={refreshWishlist}>Try Again</button>
    </div> : wishlist.length === 0 ? <div className="empty-state">
      <h2>Your wishlist is empty ❤️</h2><p>Start saving products you love.</p>
      <Link className="button" to="/products">Browse Products</Link>
    </div> : <>
      <p>{wishlist.length} products saved</p>
      <div className="products">{wishlist.map(product => <ProductCard key={product._id}
        product={product} saved onWishlistChange={changeWishlist} wishlistOnly />)}</div>
      <p><Link to="/products">Continue Shopping</Link></p>
    </>}
  </main>;
}
