import {
  Directive,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
} from '@angular/core';
import { ReplaySubject, takeUntil } from 'rxjs';
import { useIntersection } from '../shared/rxjs/use-intersection';

@Directive({
  selector: '[appIntersection]',
  standalone: true,
})
export class IntersectionDirective implements OnDestroy {
  private onDestroy$ = new ReplaySubject<void>(1);
  @Output() appIntersection = new EventEmitter<void>();

  constructor(private el: ElementRef<HTMLElement>, private zone: NgZone) {
    useIntersection(this.el.nativeElement, 0.5)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe({
        next: () => {
          this.appIntersection.emit();
          // this.animate();
        },
        complete: () => {},
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
  }
}
