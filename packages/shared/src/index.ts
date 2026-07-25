// Schemas
export {
  brandSchema,
  createBrandInput,
  updateBrandInput,
  brandResponse,
} from './schemas/brand';

export {
  categorySchema,
  createCategoryInput,
  categoryResponse,
  CATEGORY_NAMES,
} from './schemas/category';

export {
  baseProductSchema,
  createProductInput,
  updateProductInput,
  productResponse,
  productFilterSchema,
  crossRefSchema,
  specificationsSchema,
  PRODUCT_TYPES,
} from './schemas/product';

export {
  productPriceSchema,
  createPriceInput,
  priceResponse,
  PRICE_TYPES,
} from './schemas/price';

export {
  stockMovementSchema,
  createMovementInput,
  movementResponse,
  stockFilterSchema,
  movementFilterSchema,
  MOVEMENT_TYPES,
} from './schemas/stock';

export {
  loginSchema,
  loginResponse,
  tokenPayloadSchema,
} from './schemas/auth';

export {
  createUserSchema,
  updateUserSchema,
  userResponse,
  USER_ROLES,
} from './schemas/user';

export {
  supplierSchema,
  createSupplierInput,
  updateSupplierInput,
  supplierResponse,
  productSupplierSchema,
} from './schemas/supplier';

export {
  movementReportFilterSchema,
  valuationFilterSchema,
  reportMovementRow,
  valuationRow,
  valuationSummary,
} from './schemas/report';

// Types (re-export)
export type {
  BrandSchema,
  CreateBrandInput,
  UpdateBrandInput,
  BrandResponse,
  CategorySchema,
  CreateCategoryInput,
  CategoryResponse,
  BaseProductSchema,
  CreateProductInput,
  UpdateProductInput,
  ProductResponse,
  ProductFilterSchema,
  CrossRef,
  Specifications,
  ProductPriceSchema,
  CreatePriceInput,
  PriceResponse,
  StockMovementSchema,
  CreateMovementInput,
  MovementResponse,
  StockFilterSchema,
  MovementFilterSchema,
  LoginSchema,
  LoginResponse,
  TokenPayload,
  CreateUserSchema,
  UpdateUserSchema,
  UserResponse,
  SupplierSchema,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierResponse,
  ProductSupplierSchema,
  MovementReportFilter,
  ValuationFilter,
  ReportMovementRow,
  ValuationRow,
  ValuationSummary,
} from './types/index';
