import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  from,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  zip,
} from 'rxjs';
import { concatMap, take, tap } from 'rxjs/operators';
import { FirmResponse } from '../shared/models/starwars/firm';
import { SearchResponse } from '../shared/models/starwars/search';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  onDestroy$ = new ReplaySubject<void>(1);
  keyword$ = new BehaviorSubject<string | null>(null);

  search$ = this.keyword$.pipe(
    filter((keyword) => keyword !== null && keyword !== ''),
    debounceTime(300),
    switchMap((keyword) => {
      return this.http.get<SearchResponse>(
        `https://swapi.dev/api/people/?search=${keyword}`
      );
    }),
    shareReplay(1)
  );

  firmsAsName: { [name: string]: FirmResponse[] } = {};

  intersect$ = new Subject<void>();

  results: SearchResponse['results'];

  constructor(private http: HttpClient, private zone: NgZone) {
    this.search$.pipe(takeUntil(this.onDestroy$)).subscribe((response) => {
      this.results = response.results;
    });

    this.search$
      .pipe(
        switchMap((response) => {
          this.firmsAsName = {};
          return from(response.results).pipe(
            concatMap((character) => {
              return from(character.films).pipe(
                concatMap((filmUrl) => {
                  return zip([
                    this.http.get<FirmResponse>(filmUrl).pipe(
                      tap((response) => {
                        this.firmsAsName[character.name] = [
                          ...(this.firmsAsName[character.name] ??= []),
                          response,
                        ];
                        this.firmsAsName = { ...this.firmsAsName };
                      })
                    ),
                    this.intersect$,
                  ]).pipe(take(1));
                })
              );
            })
          );
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  inputKeyword(keyword: string) {
    this.keyword$.next(keyword);
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
  }
}
