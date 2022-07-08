import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';

export function useIntersection(element: HTMLElement, intersectRatio: number) {
  return new Observable<number>((subscriber) => {
    let observer: IntersectionObserver;
    let options = {
      rootMargin: '0px',
      threshold: intersectRatio,
    };

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          subscriber.next(entry.intersectionRatio)
          subscriber.complete();
        }
      }
    }, options);

    observer.observe(element);

    return {
      unsubscribe: () => {
        observer.disconnect();
      },
    };
  });
}
