-- Students need SELECT access to their own hour_entries, apprentice record, and their shop.
-- These three tables had no RLS policies for authenticated users, causing 403s on the portal.

-- hour_entries: students read their own rows
CREATE POLICY "students_read_own_hour_entries"
  ON hour_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- apprentices: students read their own record
CREATE POLICY "students_read_own_apprentice"
  ON apprentices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- shops: students read the shop they are assigned to
CREATE POLICY "students_read_assigned_shop"
  ON shops FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT shop_id FROM apprentices WHERE user_id = auth.uid() AND shop_id IS NOT NULL
      UNION
      SELECT employer_id FROM apprentices WHERE user_id = auth.uid() AND employer_id IS NOT NULL
    )
  );
