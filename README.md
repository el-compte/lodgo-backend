# Lodgo Backend

## Development Process

This project follows a structured development workflow to ensure code quality, traceability, and efficient collaboration.

### Branching Strategy
- **Feature branches**: For new features, use `feat/TICKET-ID-description` (e.g., `feat/BOOK-123-add-login`).
- **Bugfix branches**: For bug fixes, use `fix/TICKET-ID-description` (e.g., `fix/BUG-98-payment-timeout`).
- **Other branches**: Use `chore/`, `docs/`, `refactor/`, `test/`, `perf/`, `ci/`, or `build/` prefixes as appropriate.

### Ticket Updating
- Every branch must reference a ticket ID (e.g., JIRA, Trello, etc.).
- Update the ticket status at each development stage:
  1. **To Do**: Ticket is created and described.
  2. **In Progress**: Branch is created and work begins.
  3. **Code Review**: Pull request is opened, reviewers are assigned.
  4. **Testing**: Code is merged to develop/main and tested.
  5. **Done**: Ticket is closed after successful deployment.

### Commit Messages
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - Example: `feat(BOOK-123): add login endpoint`
- Commits should be descriptive and reference the ticket ID.

### Pull Requests
- Open a pull request for every branch.
- Link the pull request to the relevant ticket.
- Ensure all checks pass before merging.

### Code Quality
- Linting and formatting are enforced via ESLint and Prettier.
- Husky is used for git hooks to ensure commit message format and code quality.

### Environment Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/DevWavews/lodgo-backend.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy `.env.example` to `.env` and update values as needed.
4. Start the development server:
   ```sh
   npm run start:dev
   ```

### Docker Usage
- Build the Docker image:
  ```sh
  docker build -t nest-render .
  ```
- Run the container:
  ```sh
  docker run --env-file .env -p 4000:4000 nest-render
  ```

### API Endpoints
- Main API: `http://localhost:4000/`
- Example endpoints:
  - `/user`
  - `/auth/login`
  - `/property`

### Contact & Support
For questions or support, open an issue or contact the maintainers.
