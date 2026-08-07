# Initial implementation plan

## Product slice

Build the complete Phase 1 parent-facing shell with mock content. The first slice validates the shared content model, grade-aware discovery, mobile navigation, source attribution, handbook search, and a future admin workflow without adding authentication or ingestion infrastructure.

## File structure

```text
app/
  components/       Shared navigation, filters, cards, and page primitives
  data/             Mock JSON content, lunch, documents, and handbook excerpts
  lib/              Pure filtering and formatting rules
  types/            Shared TypeScript content model
  action/            Needs Action route
  events/            Events route
  lunch/             Lunch route
  volunteer/         Volunteer route
  documents/         Documents route
  handbook/          Handbook search route
  archive/           Newsletter archive route
  admin/             Non-authenticated workflow preview
docs/
  architecture.md    Future capability boundaries and explicit non-goals
tests/
  filtering.test.ts  Unit coverage for grade visibility rules
```

## TypeScript data model

The shared `ContentItem` model follows the product specification: content type, configurable grade tags, category tags, event/deadline fields, action/source links, publication state, action state, and audit fields. `SchoolDocument`, `LunchDay`, `HandbookSection`, and `NewsletterSource` add route-specific structure while keeping source metadata explicit.

## Filtering rules

1. `all-school` content is always visible.
2. With no grades selected, all published content is visible.
3. With one or more grades selected, content is visible when any selected grade intersects its grade tags.
4. Grade preferences are stored only on the current device under a versioned local-storage key.
5. Draft and archived records are excluded from public content views unless a route is explicitly presenting historical content.

## Delivery order

1. Establish shared types, mock data, and pure filtering functions.
2. Build the responsive shell, mobile navigation, and persistent grade selector.
3. Implement the nine requested routes using reusable cards and page primitives.
4. Add unit tests and project documentation.
5. Validate the production build and deploy the static prototype.
