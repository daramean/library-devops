INSERT INTO categories (name, description, color) VALUES
  ('Novels',        'Fictional long-form narrative',          '#6366f1'),
  ('Short stories', 'Fictional short-form narrative',         '#f59e0b'),
  ('Poems',         'Collections of poetry',                  '#10b981'),
  ('Plays',         'Dramatic works for performance',         '#3b82f6')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color = EXCLUDED.color;

UPDATE books
SET category_id = NULL
WHERE category_id NOT IN (
  SELECT id FROM categories WHERE name IN ('Novels', 'Short stories', 'Poems', 'Plays')
);

DELETE FROM categories
WHERE name NOT IN ('Novels', 'Short stories', 'Poems', 'Plays');
