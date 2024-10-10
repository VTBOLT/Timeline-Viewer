import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Task {
  id: string;
  title: string;
  dueDate: Date | null;
}

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
  startDate: Date = new Date();
  endDate: Date = new Date();
  currentDate: Date = new Date();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tasks']) {
      this.validTasks = this.tasks.filter((task) => task.dueDate !== null);
      this.validTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return 0;
      });

      if (this.validTasks.length > 0) {
        this.startDate = this.validTasks[0].dueDate!;
        this.endDate = this.validTasks[this.validTasks.length - 1].dueDate!;

        // Adjust start and end dates to include current date if necessary
        if (this.currentDate < this.startDate) {
          this.startDate = new Date(this.currentDate);
        }
        if (this.currentDate > this.endDate) {
          this.endDate = new Date(this.currentDate);
        }
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

  private calculatePosition(date: Date): string {
    const taskDate = date.getTime();
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const position =
      ((taskDate - this.startDate.getTime()) / totalDuration) * 100;
    return `${position}%`;
  }
}
