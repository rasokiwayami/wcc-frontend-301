# PR #322: language filter before and after

These are unedited, full-page browser screenshots of the actual Next.js mentors page. Both captures use the same two synthetic mentors and the same local mock backend. No live WCC data or real API credentials are used. The biography text is fixture content generated from the request the mock actually received; it is not a production UI change or an image annotation.

| Capture | Frontend revision                          | Backend received | Visible mentors |
| ------- | ------------------------------------------ | ---------------- | --------------- |
| Before  | `57cb378ad30bb27ff096acaebe97d33985e1cf66` | `language=JAVA`  | Java and Python |
| After   | `df535cf47b4e3ead57b55d2e31ad5ebb56ff1fd2` | `languages=JAVA` | Java only       |

The unchanged frontend URL is `/mentorship/mentors?language=JAVA`. The backend fixture deliberately honors only plural `languages`, modeling the controller contract described in issue #297. The real frontend API route and Axios proxy run in both cases; browser responses are not intercepted. Clearing the filter after the fix restores both mentors.

- [Before screenshot](mentor-language-before.jpg)
- [After screenshot](mentor-language-after.jpg)
- [Observed requests, browser results, and image hashes](observations.json)
- [Mock backend source](fixture-server.mjs)

## Reproduce

Prepare separate checkouts of the two revisions above and install the pinned dependencies with `pnpm install --frozen-lockfile`. Run the fixture with Node 20 or later:

```sh
node fixture-server.mjs
```

The same handler listens on loopback ports 3398 (before) and 3298 (after). Start the corresponding frontend in each checkout:

```sh
# Before checkout
API_BASE_URL=http://127.0.0.1:3398/api/cms/v1 API_KEY=local-fixture-only pnpm run dev --port 3397 --hostname 127.0.0.1
# After checkout
API_BASE_URL=http://127.0.0.1:3298/api/cms/v1 API_KEY=local-fixture-only pnpm run dev --port 3297 --hostname 127.0.0.1
```

Open `/mentorship/mentors` on each frontend, expand Filters, and select JAVA in Language. Use the same browser viewport for both captures. The screenshots here were taken through Codex browser control at its unchanged default width of 1280 px; full-page heights differ because one card is removed. No screenshot baselines were regenerated.

This demonstrates the frontend forwarding and rendering behavior against a controlled contract fixture. It does not claim verification against the deployed backend.
