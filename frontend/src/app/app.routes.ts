import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { myDetailsResolver } from './core/guards/my-details.resolver';
import { registerGuard } from './core/guards/register.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        (c) => c.AuthLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/register/register.component').then(
            (c) => c.RegisterComponent
          ),
        canDeactivate: [registerGuard],
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login.component').then((c) => c.LoginComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then(
            (c) => c.ForgotPasswordComponent
          ),
      },
      {
        path: 'verify-code',
        loadComponent: () =>
          import('./pages/verify-code/verify-code.component').then(
            (c) => c.VerifyCodeComponent
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/reset-password/reset-password.component').then(
            (c) => c.ResetPasswordComponent
          ),
      },
    ],
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (c) => c.AdminLayoutComponent
      ),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.component').then(
            (c) => c.DashboardHomeComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products-management/products-management.component').then(
            (c) => c.ProductsManagementComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories-management/categories-management.component').then(
            (c) => c.CategoriesManagementComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders-management/orders-management.component').then(
            (c) => c.OrdersManagementComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users-management/users-management.component').then(
            (c) => c.UsersManagementComponent
          ),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./pages/coupons-management/coupons-management.component').then(
            (c) => c.CouponsManagementComponent
          ),
      },
    ],
  },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/user-layout/user-layout.component').then(
        (c) => c.UserLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((c) => c.HomeComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./pages/cart/cart.component').then((c) => c.CartComponent),
        canActivate: [authGuard],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then(
            (c) => c.ProductsComponent
          ),
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./pages/details/details.component').then(
            (c) => c.DetailsComponent
          ),
        resolve: { details: myDetailsResolver },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/category/category.component').then(
            (c) => c.CategoryComponent
          ),
      },
      {
        path: 'specificCategory/:type',
        loadComponent: () =>
          import('./pages/specific-category/specific-category.component').then(
            (c) => c.SpecificCategoryComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (c) => c.ProfileComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/order-confirmation/order-confirmation.component').then(
            (c) => c.OrderConfirmationComponent
          ),
        canActivate: [authGuard],
      },
      { path: '**', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];
