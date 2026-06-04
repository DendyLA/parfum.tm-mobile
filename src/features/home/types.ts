import { CategoryItem, CurrentPromotion, ProductItem, PromoItem } from '@/services/catalog';

export type HomeData = {
  currentPromotion: CurrentPromotion;
  promotions: PromoItem[];
  categories: CategoryItem[];
  recommended: ProductItem[];
  newest: ProductItem[];
  sale: ProductItem[];
  special: ProductItem[];
};
