// Narx: rejimga qarab (optom / dona), eski narx chizilgan holda
import { useStore } from '../lib/store';
import { money } from '../lib/format';

export default function PriceTag({ product, mode, size = 'md' }) {
  const { lang } = useStore();
  const wholesale = mode === 'wholesale';
  const price = wholesale ? product.wholesalePrice : product.price;
  const old = !wholesale && product.oldPrice && product.oldPrice > product.price ? product.oldPrice : null;
  return (
    <div className={`price price-${size}`}>
      <span className="price-now">{money(price, lang)}</span>
      {old && <span className="price-old">{money(old, lang)}</span>}
    </div>
  );
}
