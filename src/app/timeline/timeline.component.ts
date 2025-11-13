import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../task-list/task-list.component';
import { environment } from '../environment';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
})
export class TimelineComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  validTasks: Task[] = [];
  currentDate: Date = new Date();
  visiblePlans: Set<string>;

  constructor() {
    this.visiblePlans = new Set(environment.visiblePlans);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks']) {
      this.validTasks = this.tasks.filter(
        (task) => task.dueDate !== null && this.visiblePlans.has(task.plan)
      );
      this.validTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return 0;
      });

      if (this.validTasks.length > 0) {
        const lastTaskDate =
          this.validTasks[this.validTasks.length - 1].dueDate!;
        environment.endDate =
          lastTaskDate > this.currentDate ? lastTaskDate : this.currentDate;
      }
    }
  }

  getPosition(date: Date | null): string {
    if (!date) return '0%';
    return this.calculatePosition(date);
  }

  getCurrentDatePosition(): string {
    return this.calculatePosition(this.currentDate);
  }

  getMarkerClass(dueDate: Date | null, completed: number): string {
    if (!dueDate) return 'timeline-marker-pending';

    const now = new Date().getTime();
    const due = dueDate.getTime();

    if (completed >= 100) {
      return 'timeline-marker-upcoming';
    } else if (due < now) {
      return 'timeline-marker-overdue';
    } else {
      return 'timeline-marker-due-today';
    }
  }

  private calculatePosition(date: Date): string {
    const taskDate = date.getTime();
    const totalDuration =
      environment.endDate.getTime() - environment.startDate.getTime();
    const position =
      ((taskDate - environment.startDate.getTime()) / totalDuration) * 100;
    return `${Math.max(0, Math.min(100, position))}%`;
  }
}
