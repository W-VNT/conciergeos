-- Create checklist tables for standardized mission tasks
-- Part of Logements improvements - Checklist Ménage

-- Checklist templates (reusable templates per organisation)
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_mission mission_type NOT NULL, -- MENAGE, CHECKIN, CHECKOUT, etc.
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist template items (tasks in the template)
CREATE TABLE checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  categorie TEXT, -- ex: "Cuisine", "Salle de bain", "Chambres"
  ordre INTEGER NOT NULL DEFAULT 0,
  photo_requise BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mission checklist items (instance per mission)
CREATE TABLE mission_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES checklist_template_items(id),
  completed BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_checklist_templates_org ON checklist_templates(organisation_id);
CREATE INDEX idx_checklist_templates_type ON checklist_templates(type_mission);
CREATE INDEX idx_checklist_template_items_template ON checklist_template_items(template_id);
CREATE INDEX idx_mission_checklist_items_mission ON mission_checklist_items(mission_id);

-- RLS Policies for checklist_templates
CREATE POLICY "Users can view org checklist templates"
ON checklist_templates FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage org checklist templates"
ON checklist_templates FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- RLS Policies for checklist_template_items
CREATE POLICY "Users can view checklist template items"
ON checklist_template_items FOR SELECT
TO authenticated
USING (
  template_id IN (
    SELECT id FROM checklist_templates
    WHERE organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage checklist template items"
ON checklist_template_items FOR ALL
TO authenticated
USING (
  template_id IN (
    SELECT id FROM checklist_templates
    WHERE organisation_id IN (
      SELECT organisation_id FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
);

-- RLS Policies for mission_checklist_items
CREATE POLICY "Users can view mission checklist items"
ON mission_checklist_items FOR SELECT
TO authenticated
USING (
  mission_id IN (
    SELECT id FROM missions
    WHERE organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update mission checklist items"
ON mission_checklist_items FOR UPDATE
TO authenticated
USING (
  mission_id IN (
    SELECT id FROM missions
    WHERE organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "System can insert mission checklist items"
ON mission_checklist_items FOR INSERT
TO authenticated
WITH CHECK (
  mission_id IN (
    SELECT id FROM missions
    WHERE organisation_id IN (
      SELECT organisation_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Comments
COMMENT ON TABLE checklist_templates IS 'Reusable checklist templates for missions';
COMMENT ON TABLE checklist_template_items IS 'Task items within a checklist template';
COMMENT ON TABLE mission_checklist_items IS 'Instance of checklist items for a specific mission';
COMMENT ON COLUMN mission_checklist_items.photo_url IS 'Photo proof uploaded by operator';
