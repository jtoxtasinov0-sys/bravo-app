// Mahsulot kartochkasi (katalog va bosh sahifada)
import { useStore } from '../lib/store';
import { pick } from '../lib/i18n';
import { availableIn, packsLeft } from '../lib/stock';
import { isLight } from '../lib/colors';
import Img from './Img';
import PriceTag from './PriceTag';

export default function ProductCard({ product, onOpen }) {
  const { lang, t, mode } = useStore();
  const available = availableIn(product, mode);
  const left = mode === 'wholesale' ? packsLeft(product) : product.pairsTotal ?? Infinity;
  const discount =
    mode !== 'wholesale' && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  return (
    <button className={'card' + (available ? '' : ' card-off')} onClick={() => onOpen(product)}>
      <div className="card-img">
        <Img src={product.images[0]} frame={product.imageFrames?.[0]} alt={product.name} />
        {!available && <span className="badge badge-red">{t.soldOut}</span>}
        {available && discount > 0 && <span className="badge badge-red">−{discount}%</span>}
        {available && left !== Infinity && left > 0 && left <= 5 && (
          <span className="badge badge-dark badge-bottom">
            {t.left}: {left}
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="card-name">{pick(product, 'name', lang)}</div>
        {product.colors?.length > 0 && (
          <div className="card-colors">
            {product.colors.slice(0, 5).map((c) => (
              <span key={c.name} className={'dot' + (isLight(c.hex) ? ' dot-light' : '')} style={{ background: c.hex }} />
            ))}
          </div>
        )}
        <PriceTag product={product} mode={mode} size="sm" />
      </div>
    </button>
  );
}
