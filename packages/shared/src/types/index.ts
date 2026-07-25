// Types inferred from Zod schemas
export type {
  BrandSchema,
  CreateBrandInput,
  UpdateBrandInput,
  BrandResponse,
} from '../schemas/brand.js';

export type {
  CategorySchema,
  CreateCategoryInput,
  CategoryResponse,
} from '../schemas/category.js';

export type {
  BaseProductSchema,
  CreateProductInput,
  UpdateProductInput,
  ProductResponse,
  ProductFilterSchema,
  CrossRef,
  Specifications,
} from '../schemas/product.js';

export type {
  ProductPriceSchema,
  CreatePriceInput,
  PriceResponse,
} from '../schemas/price.js';

export type {
  StockMovementSchema,
  CreateMovementInput,
  MovementResponse,
  StockFilterSchema,
  MovementFilterSchema,
} from '../schemas/stock.js';

export type {
  LoginSchema,
  LoginResponse,
  TokenPayload,
} from '../schemas/auth.js';

export type {
  CreateUserSchema,
  UpdateUserSchema,
  UserResponse,
} from '../schemas/user.js';

export type {
  SupplierSchema,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierResponse,
  ProductSupplierSchema,
} from '../schemas/supplier.js';

export type {
  MovementReportFilter,
  ValuationFilter,
  ReportMovementRow,
  ValuationRow,
  ValuationSummary,
} from '../schemas/report.js';
