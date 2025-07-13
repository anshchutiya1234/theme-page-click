-- Create projects table
CREATE TABLE projects (
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
CREATE TABLE project_assignments (
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

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_status ON project_assignments(status);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Admins can manage all projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Users can view active projects" ON projects
    FOR SELECT USING (status = 'active');

-- RLS Policies for project_assignments table
CREATE POLICY "Admins can manage all assignments" ON project_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

CREATE POLICY "Users can view their own assignments" ON project_assignments
    FOR SELECT USING (user_id = auth.uid());

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
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON project_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to add clicks when project is approved
CREATE OR REPLACE FUNCTION add_project_reward_clicks()
RETURNS TRIGGER AS $$
BEGIN
    -- If assignment status changed to 'approved', add reward clicks
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Add clicks to user's account (assuming you have a clicks table or update users table)
        INSERT INTO clicks (user_id, type, project_id, created_at)
        SELECT NEW.user_id, 'project_reward', NEW.project_id, NOW()
        FROM projects 
        WHERE projects.id = NEW.project_id;
        
        -- You might also want to update a total_clicks field in users table
        -- UPDATE users SET total_clicks = total_clicks + (SELECT reward_clicks FROM projects WHERE id = NEW.project_id)
        -- WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for adding reward clicks
CREATE TRIGGER add_project_reward_clicks_trigger
    AFTER UPDATE ON project_assignments
    FOR EACH ROW
    EXECUTE FUNCTION add_project_reward_clicks(); 