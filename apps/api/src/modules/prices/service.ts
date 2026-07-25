import {
  findPricesByProduct,
  createPrice,
  findCurrentActivePrice,
  updatePriceEffectiveTo,
  findOverlappingPrice,
} from './repository.js';
import { AppError } from '../../lib/errors.js';
import { findById as findProductById } from '../products/repository.js';

export async function getPriceHistory(productId: string, priceType?: string) {
  // Verify product exists
  const product = await findProductById(productId);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return findPricesByProduct(productId, priceType);
}

export async function setPrice(
  productId: string,
  data: {
    priceType: string;
    price: number;
    discountPct?: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
    notes?: string;
  },
) {
  // Verify product exists
  const product = await findProductById(productId);
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  // Check for overlapping date ranges
  const overlap = await findOverlappingPrice(
    productId,
    data.priceType,
    data.effectiveFrom,
    data.effectiveTo,
  );

  if (overlap) {
    throw AppError.unprocessable(
      `Overlapping price period exists for type '${data.priceType}'`,
    );
  }

  // If there's a currently active price of the same type with no end date,
  // set its effective_to to the new price's effective_from
  const currentActive = await findCurrentActivePrice(productId, data.priceType);
  if (currentActive && !currentActive.effectiveTo) {
    await updatePriceEffectiveTo(currentActive.id, data.effectiveFrom);
  }

  // Create the new price
  const newPrice = await createPrice({
    productId,
    priceType: data.priceType,
    price: data.price.toString(),
    discountPct: data.discountPct?.toString(),
    effectiveFrom: data.effectiveFrom,
    effectiveTo: data.effectiveTo,
    notes: data.notes,
  });

  return newPrice;
}
