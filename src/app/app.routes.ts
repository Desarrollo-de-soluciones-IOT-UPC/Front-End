import { Routes } from '@angular/router';

import { AdminLayout } from './layouts/admin-layout/admin-layout';

import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { WorkOrders } from './features/work-orders/pages/work-orders/work-orders';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        component: Dashboard,
      },
      {
        path: 'work-orders',
        component: WorkOrders,
      },
    ],
  },
];