-- Add owner_id to businesses table
ALTER TABLE businesses ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing RLS policy for service_role if we want to replace it, 
-- but actually let's keep service_role full access and add policies for authenticated users.

-- Create policies for authenticated users to access their own business data
CREATE POLICY "Users can view their own businesses" 
ON businesses FOR SELECT 
TO authenticated 
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own businesses" 
ON businesses FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own businesses" 
ON businesses FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid()) 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own businesses" 
ON businesses FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());

-- RLS for Agents (cascade from business)
CREATE POLICY "Users can view agents for their business" 
ON agents FOR SELECT 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert agents for their business" 
ON agents FOR INSERT 
TO authenticated 
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update agents for their business" 
ON agents FOR UPDATE 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete agents for their business" 
ON agents FOR DELETE 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- RLS for Tasks (cascade from business)
CREATE POLICY "Users can view tasks for their business" 
ON tasks FOR SELECT 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert tasks for their business" 
ON tasks FOR INSERT 
TO authenticated 
WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update tasks for their business" 
ON tasks FOR UPDATE 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete tasks for their business" 
ON tasks FOR DELETE 
TO authenticated 
USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
