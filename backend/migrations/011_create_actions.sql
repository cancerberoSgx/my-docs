CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  params_schema JSONB
);

CREATE TABLE IF NOT EXISTS tool_actions (
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  action_id INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, action_id)
);

INSERT INTO actions (name, description, params_schema)
VALUES ('load', 'Load and process the document content', NULL)
ON CONFLICT DO NOTHING;

-- All existing tools get the default 'load' action
INSERT INTO tool_actions (tool_id, action_id)
SELECT t.id, a.id FROM tools t, actions a WHERE a.name = 'load'
ON CONFLICT DO NOTHING;
