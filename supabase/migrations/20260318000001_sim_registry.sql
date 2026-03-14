-- HVAC simulation registry and attempt tracking.
-- Simulations are credential-linked assessments, not just practice content.
-- sim_key matches the JSON filename key (sim-01 … sim-10).

CREATE TABLE training_simulations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_key         TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  system          TEXT NOT NULL,
  difficulty      TEXT NOT NULL DEFAULT 'intermediate'
                    CHECK (difficulty IN ('beginner','intermediate','advanced')),
  credential_id   UUID REFERENCES credential_registry(id) ON DELETE SET NULL,
  competency_area TEXT,
  content_path    TEXT NOT NULL,
  passing_score   INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 1 AND 100),
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sim_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES training_simulations(id) ON DELETE CASCADE,
  learner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  passed        BOOLEAN,
  -- score = (correct_steps / total_steps) * 100, stored for fast querying
  score         INTEGER CHECK (score BETWEEN 0 AND 100),
  -- full step-by-step path taken: [{stepId, choiceLabel, correct, ts}]
  steps_taken   JSONB NOT NULL DEFAULT '[]',
  correct_steps INTEGER NOT NULL DEFAULT 0,
  total_steps   INTEGER NOT NULL DEFAULT 0,
  time_seconds  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sim_attempts_learner    ON sim_attempts(learner_id);
CREATE INDEX idx_sim_attempts_simulation ON sim_attempts(simulation_id);
CREATE INDEX idx_sim_attempts_passed     ON sim_attempts(learner_id, passed);

ALTER TABLE training_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_attempts         ENABLE ROW LEVEL SECURITY;

-- training_simulations policies
CREATE POLICY "Public read active sims"
  ON training_simulations FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage sims"
  ON training_simulations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- sim_attempts policies
CREATE POLICY "Learners read own attempts"
  ON sim_attempts FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Learners insert own attempts"
  ON sim_attempts FOR INSERT WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Learners update own attempts"
  ON sim_attempts FOR UPDATE USING (learner_id = auth.uid());

CREATE POLICY "Admins read all attempts"
  ON sim_attempts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- Seed: 10 HVAC sims linked to EPA Section 608 credential
-- EPA-608 credential id: d37ae8a2-9297-44d1-83db-fa7ef375b796
INSERT INTO training_simulations
  (sim_key, title, system, difficulty, credential_id, competency_area, content_path, passing_score, sort_order)
VALUES
  ('sim-01','No Cooling — Residential Split System',       'R-410A split system, 3-ton, TXV metering',    'beginner',     'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-01.json',70,1),
  ('sim-02','Compressor Hums But Will Not Start',          'R-410A split system, 2-ton',                  'intermediate', 'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-02.json',70,2),
  ('sim-03','Gas Furnace — Ignites Then Shuts Off',        'Natural gas 80% AFUE furnace',                'beginner',     'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-03.json',70,3),
  ('sim-04','Heat Pump — No Heating in Winter',            'R-410A heat pump, 3-ton, O-type wiring',      'intermediate', 'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-04.json',70,4),
  ('sim-05','High Head Pressure — Outdoor Unit',           'R-410A split system, 4-ton',                  'intermediate', 'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-05.json',75,5),
  ('sim-06','Frozen Evaporator Coil',                      'R-410A split system, 2-ton, fixed orifice',   'beginner',     'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-06.json',70,6),
  ('sim-07','Refrigerant Leak — Low Charge Diagnosis',     'R-410A split system, 3-ton, TXV',             'advanced',     'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-07.json',80,7),
  ('sim-08','Furnace Short Cycling',                       'Natural gas 96% AFUE two-stage furnace',      'intermediate', 'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-08.json',70,8),
  ('sim-09','EPA 608 — Refrigerant Recovery Scenario',     'R-410A rooftop unit, 10-ton, TXV',            'advanced',     'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-09.json',80,9),
  ('sim-10','Electrical — Contactor and Capacitor Diagnosis','R-410A split system, 2-ton',                'intermediate', 'd37ae8a2-9297-44d1-83db-fa7ef375b796','hvac_refrigeration','content/hvac-sims/sim-10.json',70,10)
ON CONFLICT (sim_key) DO NOTHING;
