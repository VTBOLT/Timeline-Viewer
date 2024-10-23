import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';
import {
  animate,
  style,
  transition,
  trigger,
  state,
} from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TaskListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('moveContent', [
      state('position1', style({ transform: 'translate(0, 0)' })),
      state('position2', style({ transform: 'translate(2px, 2px)' })),
      state('position3', style({ transform: 'translate(-2px, 2px)' })),
      state('position4', style({ transform: 'translate(-2px, -2px)' })),
      state('position5', style({ transform: 'translate(2px, -2px)' })),
      transition('* => *', animate('10000ms ease-in-out')),
    ]),
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'timeline-viewer';
  position: string = 'position1';
  private moveInterval: any;
  private readonly positions = [
    'position1',
    'position2',
    'position3',
    'position4',
    'position5',
  ];
  private currentPositionIndex = 0;

  ngOnInit() {
    // Start the movement cycle
    this.moveInterval = setInterval(() => {
      this.currentPositionIndex =
        (this.currentPositionIndex + 1) % this.positions.length;
      this.position = this.positions[this.currentPositionIndex];
    }, 10000); // Change position every 10 seconds
  }

  ngOnDestroy() {
    // Clean up the interval when the component is destroyed
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
  }
}
