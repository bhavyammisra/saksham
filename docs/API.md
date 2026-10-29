# API

Saksham has no server code of its own. The app talks to Supabase directly with the public anon key: reads and writes go to tables protected by row level security (`DATA_MODEL.md`), and the few actions that need extra checks are Postgres functions (RPCs). The service-role key is never used (NFR-02).

Every function below is `security definer` with `search_path = ''`, checks its own inputs and its caller, and is callable only by the roles listed. Errors use standard Postgres codes, and the app turns them into calm, plain messages (`src/lib/classroom.ts`).

## For children

### `join_class(code, first_name, band, avatar)`

Joins the class with this code. It also works to change classes or update the child's name, band or look.

- **Who:** a signed-in **anonymous** account (a child). Teachers can't join.
- **Inputs:**
  - `code`: the 6-character join code (case and spaces don't matter).
  - `first_name`: 1 to 20 letters, Latin or an Indian script.
  - `band`: `young` or `teen`.
  - `avatar`: a JSON object, 2 KB at most.
- **Returns:** `class_id`, `class_name`.
- **Errors:**
  - `28000`: not signed in.
  - `42501`: not a child account.
  - `22023`: bad name, band or avatar.
  - `P0002`: unknown **or** switched-off code. Both give the same answer, so codes can't be guessed by probing.

### `leave_class()`

Removes the child from their class and deletes their class data. Their game on the device keeps everything.

- **Who:** any signed-in account (it only ever touches the caller's own row).

### `my_class_mission()`

The child's class mission: one total for the whole class, with no names and no per-child numbers (D-047).

- **Who:** signed-in accounts.
- **Returns:** `class_name`, `mission_target`, `total_stars`.

## For teachers

Teachers create, rename and switch codes on or off through the `classes` table itself (row level security limits them to their own classes). Two actions need functions:

### `rotate_join_code(class)`

Gives the class a new random join code, so the old one stops working.

- **Who:** the teacher of that class (else `42501`).
- **Returns:** the new code.

### `delete_class(class)`

Deletes the class and, with it, every student's class data.

- **Who:** the teacher of that class (else `42501`).

## For reviewers

### `submit_content_for_review(item, item_kind, item_lang, hash)`

Sends a content item (by its id and hash) for review. A new hash for an existing item sends it back to review. Every step is written to `content_events`.

- **Who:** reviewers and admins (else `42501`).

### `review_content(item, decision, note)`

Publishes, rejects or sends back an item.

- **Who:** reviewers (else `42501`).
- **Inputs:** `decision` is `published`, `rejected` or `in_review`. A rejection needs a `note` (else `22023`).
- **Errors:** an unknown item gives `P0002`.

## For everyone

### `published_content()`

Which items are published: `id`, `content_hash`, `reviewed_at`, and nothing else (no reviewer, no notes). The app uses it for the "Reviewed" tick on a card (FR-16). It is open even to signed-out visitors, because most children never join a class and it holds no personal data.

## How the app uses them

- `src/lib/classroom.ts`: `join_class`, `leave_class`, `my_class_mission`.
- `src/lib/sync.ts`: upserts into `progress` and `student_extras`, inserts into `quiz_attempts`, then reads them back to merge (D-046).
- `src/screens/Teacher.tsx` and `TeacherDashboard.tsx`: the `classes` table, `rotate_join_code`, `delete_class` and the three class views.
- `src/screens/Reviewer.tsx`: `submit_content_for_review`, `review_content`, and the `content_items` table.
- `src/lib/published.ts`: `published_content`.
