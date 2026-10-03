import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';
import AddToCartButton from './AddToCartButton';

// Display one product supplied by Products.jsx; no product data is hardcoded here.
export default function ProductCard({ product, saved, onWishlistChange, wishlistDisabled, wishlistOnly = false }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-image" aria-label={`View ${product.name}`}><ProductImage product={product} /></Link>
      <div className="product-card-body">
      <p className="eyebrow">{product.category}</p>
      <h2>{product.name}</h2>
      {/* Format the price with Indian digit grouping. */}
      <p className="price">₹{product.price.toLocaleString('en-IN')}</p>
      <p className={`stock ${product.stock > 0 ? 'available' : 'unavailable'}`}>{product.stock > 0 ? `${product.stock} units left` : 'Out of stock'}</p>
      {/* Navigate using this product's MongoDB ID. */}
      <Link className="details-link" to={`/products/${product._id}`}>View Details</Link>
      <div className="product-actions">
        <WishlistButton product={product} saved={saved} onChange={onWishlistChange}
          disabled={wishlistDisabled} removeOnly={wishlistOnly} />
        {!wishlistOnly && <AddToCartButton product={product} />}
      </div>
      </div>
    </article>
  );
}
