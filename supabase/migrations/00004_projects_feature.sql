-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reference_link TEXT,
    recreate_link TEXT,
    download_link TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    reward_clicks INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_assignments table (which users are assigned to which projects)
CREATE TABLE IF NOT EXISTS project_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'submitted', 'approved', 'rejected_by_admin')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submission_link TEXT,
    admin_feedback TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Add project_id column to clicks table if it doesn't exist
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Update the clicks type constraint to include project_reward
ALTER TABLE clicks DROP CONSTRAINT IF EXISTS clicks_type_check;
ALTER TABLE clicks ADD CONSTRAINT clicks_type_check CHECK (type IN ('direct', 'bonus', 'project_reward'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_status ON project_assignments(status);
CREATE INDEX IF NOT EXISTS idx_clicks_project_id ON clicks(project_id);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
CREATE POLICY "Admins can manage all projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Users can view active projects" ON projects;
CREATE POLICY "Users can view active projects" ON projects
    FOR SELECT USING (status = 'active');

-- RLS Policies for project_assignments table
DROP POLICY IF EXISTS "Admins can manage all assignments" ON project_assignments;
CREATE POLICY "Admins can manage all assignments" ON project_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Users can view their own assignments" ON project_assignments;
CREATE POLICY "Users can view their own assignments" ON project_assignments
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own assignments" ON project_assignments;
CREATE POLICY "Users can update their own assignments" ON project_assignments
    FOR UPDATE USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_assignments_updated_at ON project_assignments;
CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON project_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to add clicks when project is approved
CREATE OR REPLACE FUNCTION add_project_reward_clicks()
RETURNS TRIGGER AS $$
DECLARE
    project_reward_points INTEGER;
BEGIN
    -- If assignment status changed to 'approved', add reward clicks
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Get the reward points for this project
        SELECT reward_clicks INTO project_reward_points
        FROM projects 
        WHERE id = NEW.project_id;
        
        -- Add the reward clicks to user's account
        INSERT INTO clicks (user_id, type, project_id, ip_address, user_agent, created_at)
        SELECT 
            NEW.user_id, 
            'project_reward', 
            NEW.project_id, 
            '127.0.0.1', 
            'PROJECT_REWARD_SYSTEM',
            NOW()
        FROM generate_series(1, COALESCE(project_reward_points, 0));
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for adding reward clicks
DROP TRIGGER IF EXISTS add_project_reward_clicks_trigger ON project_assignments;
CREATE TRIGGER add_project_reward_clicks_trigger
    AFTER UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION add_project_reward_clicks(); 