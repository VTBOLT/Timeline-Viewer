import { Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';

export const routes: Routes = [
  { path: 'auth-callback', component: TaskListComponent },
];
