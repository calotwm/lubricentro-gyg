// Types inferred from Zod schemas
export type {
  BrandSchema,
  CreateBrandInput,
  UpdateBrandInput,
  BrandResponse,
} from '../schemas/brand';

export type {
  CategorySchema,
  CreateCategoryInput,
  CategoryResponse,
} from '../schemas/category';

export type {
  BaseProductSchema,
  CreateProductInput,
  UpdateProductInput,
  ProductResponse,
  ProductFilterSchema,
  CrossRef,
  Specifications,
} from '../schemas/product';

export type {
  ProductPriceSchema,
  CreatePriceInput,
  PriceResponse,
} from '../schemas/price';

export type {
  StockMovementSchema,
  CreateMovementInput,
  MovementResponse,
  StockFilterSchema,
  MovementFilterSchema,
} from '../schemas/stock';

export type {
  LoginSchema,
  LoginResponse,
  TokenPayload,
} from '../schemas/auth';

export type {
  CreateUserSchema,
  UpdateUserSchema,
  UserResponse,
} from '../schemas/user';

export type {
  SupplierSchema,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierResponse,
  ProductSupplierSchema,
} from '../schemas/supplier';

export type {
  MovementReportFilter,
  ValuationFilter,
  ReportMovementRow,
  ValuationRow,
  ValuationSummary,
} from '../schemas/report';
