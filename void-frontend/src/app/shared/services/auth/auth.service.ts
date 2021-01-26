import { Injectable } from '@angular/core';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, of, Observable, BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { tap, catchError, concatMap, shareReplay, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Create an observable of Auth0 instance of client
  auth0Client$ = (from(
    createAuth0Client({
      domain: 'dev-void.us.auth0.com',
      client_id: 'TecKzu7OhQKztXweiBO5Lv8pDSffkpfh',
      redirect_uri: 'http://localhost:4200/callback',
      audience: 'dev_void_be',
      scope: 'openid profile email'
    }),
  ) as Observable<Auth0Client>).pipe(
    shareReplay(1), // Every subscription receives the same shared value
    catchError(err => throwError(err)),
  );
  // Define observables for SDK methods that return promises by default
  // For each Auth0 SDK method, first ensure the client instance is ready
  // concatMap: Using the client instance, call SDK method; SDK returns a promise
  // from: Convert that resulting promise into an observable
  isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap(res => (this.loggedIn = res)),
  );
  handleRedirectCallback$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())),
  );
  // Create subject and public observable of user profile data
  private userProfileSubject$ = new BehaviorSubject<User>(null);
  userProfile$ = this.userProfileSubject$.asObservable();
  // Create subject and public observable of access token data
  private accessTokenSubject$ = new BehaviorSubject<any>(null);
  accessToken$ = this.accessTokenSubject$.asObservable();
  // Create a local property for login status
  loggedIn: boolean = null;

  constructor(private router: Router) { }


  // When calling, options can be passed if desired
  // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
  getUser$(options?): Observable<User> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      map(user => {
        let admin = false;
        Object.keys(user).forEach(function (key, index) {
          if (key.endsWith('/roles') && (user[key] instanceof Array) && user[key].includes('Admin')) {
            admin = true;
          }
        });
        return {
          email: user.email,
          admin: admin
        };
      }),
      tap(user => this.userProfileSubject$.next(user)),
    );
  }

  localAuthSetup() {
    // This should only be called on app initialization
    // Set up local authentication streams
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          // If authenticated, get user and set in app
          // NOTE: you could pass options here if needed
          return this.getUser$();
        }
        // If not authenticated, return stream that emits 'false'
        return of(loggedIn);
      }),
    );
    checkAuth$.subscribe((response: { [key: string]: any } | boolean) => {
      // If authenticated, response will be user object
      // If not authenticated, response will be 'false'
      this.loggedIn = !!response;
    });
  }

  login(redirectPath: string = '/') {
    // A desired redirect path can be passed to login method
    // (e.g., from a route guard)
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log in
      client.loginWithRedirect({
        redirect_uri: 'http://localhost:4200/callback',
        appState: { target: redirectPath },
      });
    });
  }

  handleAuthCallback() {
    // Only the callback component should call this method
    // Call when app reloads after user logs in with Auth0
    let targetRoute: string; // Path to redirect to after login processsed
    const authComplete$ = this.handleRedirectCallback$.pipe(
      // Have client, now call method to handle auth callback redirect
      tap(cbRes => {
        // Get and set target redirect route from callback results
        targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
      }),
      concatMap(() => {
        // Redirect callback complete; get user and login status
        return combineLatest([this.getUser$(), this.isAuthenticated$]);
      }),
    );
    // Subscribe to authentication completion observable
    // Response will be an array of user and login status
    authComplete$.subscribe(([user, loggedIn]) => {
      // Redirect to target route after callback processing
      this.router.navigate([targetRoute]);
    });
  }

  logout() {
    // Ensure Auth0 client instance exists
    this.auth0Client$.subscribe((client: Auth0Client) => {
      // Call method to log out
      client.logout({
        client_id: 'TecKzu7OhQKztXweiBO5Lv8pDSffkpfh',
        returnTo: 'http://localhost:4200/login',
      });
    });
  }

  getAccessToken(): Observable<any> {
    return this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getTokenSilently())),
      tap(token => this.accessTokenSubject$.next(token)),
    );
  }
}