import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { TaskService } from '../task.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TimelineComponent } from '../timeline/timeline.component';
import { environment } from '../environment';

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  plan: string;
}
interface TaskColumn {
  name: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule,
    TimelineComponent,
  ],
})
export class TaskListComponent implements OnInit {
  taskColumns: TaskColumn[] = [];
  tasks: Task[] = [];
  currDate: Date = new Date();
  sortedTasks: Task[] = [];
  visiblePlans: Set<string>;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.visiblePlans = new Set(environment.visiblePlans);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const error = params['error'];
      if (token) {
        this.authService.handleCallback(token);
        this.router.navigate(['/']);
        this.snackBar.open('Successfully logged in', 'Close', {
          duration: 3000,
        });
      } else if (error) {
        this.snackBar.open(`Authentication error: ${error}`, 'Close', {
          duration: 5000,
        });
      }
    });

    if (this.isAuthenticated()) {
      this.getTasks();
    }
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
    this.tasks = [];
    this.snackBar.open('Logged out successfully', 'Close', { duration: 3000 });
  }

  getTasks() {
    this.authService.getAccessToken().subscribe((token) => {
      if (token) {
        this.taskService.getTasks(token).subscribe(
          (response) => {
            this.tasks = response.value.map((task: any) => ({
              ...task,
              dueDate: this.isValidDate(task.dueDate)
                ? new Date(task.dueDate)
                : null,
            }));
            this.organizeTasksByPlan();
            this.snackBar.open('Tasks fetched successfully', 'Close', {
              duration: 3000,
            });
          },
          (error) => {
            console.error('Error fetching tasks:', error);
            this.snackBar.open('Failed to fetch tasks', 'Close', {
              duration: 5000,
            });
          }
        );
      } else {
        this.snackBar.open('No access token available', 'Close', {
          duration: 5000,
        });
      }
    });
  }

  isValidDate(date: any): boolean {
    return date && new Date(date).getTime() > 0;
  }

  sortTasks() {
    const tasksWithDates = this.tasks.filter((task) => task.dueDate !== null);
    const tasksWithoutDates = this.tasks.filter(
      (task) => task.dueDate === null
    );

    tasksWithDates.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });

    this.sortedTasks = [...tasksWithoutDates, ...tasksWithDates];
  }

  compareDate(date: Date | null): boolean {
    if (!date) {
      return false;
    }
    return date.getTime() < this.currDate.getTime();
  }

  private organizeTasksByPlan() {
    const planMap = new Map<string, Task[]>();

    this.tasks.forEach((task) => {
      const planName = task.plan || 'No Plan';
      console.log(planName);
      if (this.visiblePlans.size === 0 || this.visiblePlans.has(planName)) {
        if (!planMap.has(planName)) {
          planMap.set(planName, []);
        }
        planMap.get(planName)?.push(task);
      }
    });

    this.taskColumns = Array.from(planMap.entries()).map(([name, tasks]) => ({
      name,
      tasks: tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      }),
    }));
  }
}
