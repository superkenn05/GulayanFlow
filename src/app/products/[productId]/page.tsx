
import { MOCK_PRODUCTS } from '@/app/lib/mock-data'
import ProductDetailClient from './ProductDetailClient'

export const generateStaticParams = () =>
  MOCK_PRODUCTS.map((product) => ({ productId: product.id }))

export default function ProductDetailPage({
  params,
}: {
  params: { productId: string }
}) {
  return <ProductDetailClient productId={params.productId} />
}
