export const baseUrl = 'http://localhost:8000';
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SsbnyGb68ErLqP1BkCrwb11r34YKDFc2mVlJNF1cn2PgpdBfoA8OcUUQ79AJ5y6VKsuF6qhi9AtQe0KKeIk9MIH00JZrdKZPK';

export const API_ENDPOINTS = {
  // Authentication & Password Reset Endpoints
  LOGIN: `${baseUrl}/api/v1/auth/login`,
  SIGNUP: `${baseUrl}/api/v1/auth/signup`,
  FORGOT_PASSWORD: `${baseUrl}/api/v1/auth/forgotPassword`,
  VERIFY_RESET_CODE: `${baseUrl}/api/v1/auth/verifyResetCode`,
  RESET_PASSWORD: `${baseUrl}/api/v1/auth/resetPassword`,

  // Products Endpoints (Standard API route)
  PRODUCTS: `${baseUrl}/api/v1/products`,
  ADMIN_PRODUCTS: `${baseUrl}/api/v1/products`,

  // Categories Endpoints (Standard API route)
  CATEGORIES: `${baseUrl}/api/v1/categories`,
  ADMIN_CATEGORIES: `${baseUrl}/api/v1/categories`,

  // Subcategories Endpoints
  SUBCATEGORIES: `${baseUrl}/api/v1/subcategories`,
  ADMIN_SUBCATEGORIES: `${baseUrl}/api/v1/subcategories`,

  STATS: `${baseUrl}/api/v1/dashboard/stats`,
  USERS: `${baseUrl}/api/v1/users`,
  CART: `${baseUrl}/api/v1/cart`,
  ORDERS: `${baseUrl}/api/v1/orders`,
  WISHLIST: `${baseUrl}/api/v1/wishlist`,
  ADDRESSES: `${baseUrl}/api/v1/addresses`,
  BRANDS: `${baseUrl}/api/v1/brands`
};
