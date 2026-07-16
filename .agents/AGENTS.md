# Workspace Customization Rules

### Backend-Driven Data Operations (Search/Sort)

1. **No Client-Side Processing**: Never use array methods (`.filter()`, `.sort()`, `.slice()`) in Angular TypeScript components or services to filter, search, or sort datasets returned from the server.
2. **Strict Query Params**: Always delegate search and sort tasks to the backend API using URL Query Parameters:
   - For searching: Use `keyword` query parameter (matches title and description on backend).
   - For sorting: Use `sort` query parameter (e.g. `sort=price`, `sort=-price`, `sort=-createdAt`).
3. **Unified Requests**: Always combine active search filters and sorting options into a single HTTP request (e.g. using RxJS `combineLatest` and `switchMap`) to avoid redundant API triggers.
4. **URL Synchronization**: Ensure that the search and sort state is synchronized with the browser URL query parameters (`keyword` and `sort`) so that state is retained upon reload or navigation.
