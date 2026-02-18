-- Add logement_id to checklist_templates for per-property checklist configuration
ALTER TABLE checklist_templates
  ADD COLUMN logement_id UUID REFERENCES logements(id) ON DELETE CASCADE;

CREATE INDEX idx_checklist_templates_logement ON checklist_templates(logement_id);
