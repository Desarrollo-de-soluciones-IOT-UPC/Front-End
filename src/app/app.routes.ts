import { Routes } from '@angular/router';

import { adminGuard, techGuard } from './core/guards/auth.guard';

import { AdminLayout }    from './layouts/admin-layout/admin-layout';
import { TechLayout }     from './layouts/tech-layout/tech-layout';

import { Login }          from './features/auth/pages/login/login';
import { Dashboard }      from './features/dashboard/pages/dashboard/dashboard';
import { WorkOrders }     from './features/work-orders/pages/work-orders/work-orders';
import { NewWorkOrder }   from './features/work-orders/pages/new-work-order/new-work-order';
import { History }        from './features/history/pages/history/history';
import { Users }          from './features/users/pages/users/users';
import { NewAdmin }       from './features/users/pages/new-admin/new-admin';
import { NewTechnician }  from './features/users/pages/new-technician/new-technician';
import { EditClient }     from './features/users/pages/edit-client/edit-client';

import { TechSchedule }        from './features/tech/pages/tech-schedule/tech-schedule';
import { TechWorkOrders }      from './features/tech/pages/tech-work-orders/tech-work-orders';
import { TechWorkOrderDetail } from './features/tech/pages/tech-work-order-detail/tech-work-order-detail';
import { TechHistory }         from './features/tech/pages/tech-history/tech-history';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '',                          component: Dashboard },
      { path: 'work-orders',               component: WorkOrders },
      { path: 'work-orders/new',           component: NewWorkOrder },
      { path: 'history',                   component: History },
      { path: 'users',                     component: Users },
      { path: 'users/new-admin',           component: NewAdmin },
      { path: 'users/new-technician',      component: NewTechnician },
      { path: 'users/edit-admin/:id',      component: NewAdmin },
      { path: 'users/edit-technician/:id', component: NewTechnician },
      { path: 'users/edit-client/:id',     component: EditClient },
    ],
  },

  {
    path: 'tech',
    component: TechLayout,
    canActivate: [techGuard],
    children: [
      { path: '',                component: TechSchedule },
      { path: 'work-orders',     component: TechWorkOrders },
      { path: 'work-orders/:id', component: TechWorkOrderDetail },
      { path: 'history',         component: TechHistory },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
