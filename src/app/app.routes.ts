import { Routes } from '@angular/router';

import { AdminLayout }    from './layouts/admin-layout/admin-layout';
import { Dashboard }      from './features/dashboard/pages/dashboard/dashboard';
import { WorkOrders }     from './features/work-orders/pages/work-orders/work-orders';
import { NewWorkOrder }   from './features/work-orders/pages/new-work-order/new-work-order';
import { History }        from './features/history/pages/history/history';
import { Users }          from './features/users/pages/users/users';
import { NewAdmin }       from './features/users/pages/new-admin/new-admin';
import { NewTechnician }  from './features/users/pages/new-technician/new-technician';
import { EditClient }     from './features/users/pages/edit-client/edit-client';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '',                      component: Dashboard },
      { path: 'work-orders',           component: WorkOrders },
      { path: 'work-orders/new',       component: NewWorkOrder },
      { path: 'history',               component: History },
      { path: 'users',                 component: Users },
      { path: 'users/new-admin',       component: NewAdmin },
      { path: 'users/new-technician',  component: NewTechnician },
      { path: 'users/edit-admin/:id',       component: NewAdmin },
      { path: 'users/edit-technician/:id',  component: NewTechnician },
      { path: 'users/edit-client/:id',      component: EditClient },
    ],
  },
];
