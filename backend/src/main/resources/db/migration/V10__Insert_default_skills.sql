-- V10: Insert default skills based on requirements
INSERT INTO skills (name, category, applicable_level, description, display_order) VALUES

-- Athletic Skills (for both levels)
('General Motor Skills', 'ATHLETIC', 'DEVELOPMENT', 'Overall coordination and movement skills', 1),
('General Motor Skills', 'ATHLETIC', 'ADVANCED', 'Overall coordination and movement skills', 1),
('Strength', 'ATHLETIC', 'DEVELOPMENT', 'Physical strength and power', 2),
('Strength', 'ATHLETIC', 'ADVANCED', 'Physical strength and power', 2),
('Running Technique', 'ATHLETIC', 'DEVELOPMENT', 'Proper running form and technique', 3),
('Running Technique', 'ATHLETIC', 'ADVANCED', 'Proper running form and technique', 3),
('Speed 30m', 'ATHLETIC', 'DEVELOPMENT', '30 meter sprint speed', 4),
('Speed 30m', 'ATHLETIC', 'ADVANCED', '30 meter sprint speed', 4),

-- Technical Skills for Development Level
('Receiving / Control', 'TECHNICAL', 'DEVELOPMENT', 'Ball control and first touch', 1),
('Passing', 'TECHNICAL', 'DEVELOPMENT', 'General passing ability', 2),
('Short Passing Right', 'TECHNICAL', 'DEVELOPMENT', 'Short pass accuracy with right foot', 3),
('Long Passing Right', 'TECHNICAL', 'DEVELOPMENT', 'Long pass accuracy with right foot', 4),
('Short Passing Left', 'TECHNICAL', 'DEVELOPMENT', 'Short pass accuracy with left foot', 5),
('Long Passing Left', 'TECHNICAL', 'DEVELOPMENT', 'Long pass accuracy with left foot', 6),
('Dribbling', 'TECHNICAL', 'DEVELOPMENT', 'Ability to dribble past opponents', 7),
('Shooting', 'TECHNICAL', 'DEVELOPMENT', 'Goal scoring technique', 8),
('Finishing', 'TECHNICAL', 'DEVELOPMENT', 'Ability to finish scoring opportunities', 9),
('Defending 1v1', 'TECHNICAL', 'DEVELOPMENT', 'One-on-one defensive skills', 10),
('Controlling 1v1', 'TECHNICAL', 'DEVELOPMENT', 'Ball control under pressure', 11),
('Frontal 1v1', 'TECHNICAL', 'DEVELOPMENT', 'Direct confrontation skills', 12),

-- Technical Skills for Advanced Level (includes all development skills)
('Receiving / Control', 'TECHNICAL', 'ADVANCED', 'Ball control and first touch', 1),
('Passing', 'TECHNICAL', 'ADVANCED', 'General passing ability', 2),
('Short Passing Right', 'TECHNICAL', 'ADVANCED', 'Short pass accuracy with right foot', 3),
('Long Passing Right', 'TECHNICAL', 'ADVANCED', 'Long pass accuracy with right foot', 4),
('Short Passing Left', 'TECHNICAL', 'ADVANCED', 'Short pass accuracy with left foot', 5),
('Long Passing Left', 'TECHNICAL', 'ADVANCED', 'Long pass accuracy with left foot', 6),
('Dribbling', 'TECHNICAL', 'ADVANCED', 'Ability to dribble past opponents', 7),
('Shooting', 'TECHNICAL', 'ADVANCED', 'Goal scoring technique', 8),
('Finishing', 'TECHNICAL', 'ADVANCED', 'Ability to finish scoring opportunities', 9),
('Defending 1v1', 'TECHNICAL', 'ADVANCED', 'One-on-one defensive skills', 10),
('Controlling 1v1', 'TECHNICAL', 'ADVANCED', 'Ball control under pressure', 11),
('Frontal 1v1', 'TECHNICAL', 'ADVANCED', 'Direct confrontation skills', 12),

-- Advanced Technical Skills (Advanced level only)
('Heading', 'TECHNICAL', 'ADVANCED', 'Aerial ability and heading technique', 13),
('1 touch with bounce', 'TECHNICAL', 'ADVANCED', 'Ball control with bounce under pressure', 14),
('1 touch without bounce', 'TECHNICAL', 'ADVANCED', 'First touch precision without bounce', 15),
('Control / Wall / Control', 'TECHNICAL', 'ADVANCED', 'Wall pass execution and control', 16),

-- Mentality Skills (for both levels)
('Technical Player', 'MENTALITY', 'DEVELOPMENT', 'Technical decision making and execution', 1),
('Technical Player', 'MENTALITY', 'ADVANCED', 'Technical decision making and execution', 1),
('Team Player', 'MENTALITY', 'DEVELOPMENT', 'Teamwork and collaboration skills', 2),
('Team Player', 'MENTALITY', 'ADVANCED', 'Teamwork and collaboration skills', 2),
('Game IQ', 'MENTALITY', 'DEVELOPMENT', 'Understanding of game situations', 3),
('Game IQ', 'MENTALITY', 'ADVANCED', 'Understanding of game situations', 3),

-- Personality Skills (for both levels)
('Discipline', 'PERSONALITY', 'DEVELOPMENT', 'Self-control and adherence to rules', 1),
('Discipline', 'PERSONALITY', 'ADVANCED', 'Self-control and adherence to rules', 1),
('Coachable', 'PERSONALITY', 'DEVELOPMENT', 'Receptiveness to coaching and feedback', 2),
('Coachable', 'PERSONALITY', 'ADVANCED', 'Receptiveness to coaching and feedback', 2),
('Flair / Daring', 'PERSONALITY', 'DEVELOPMENT', 'Creativity and willingness to take risks', 3),
('Flair / Daring', 'PERSONALITY', 'ADVANCED', 'Creativity and willingness to take risks', 3),
('Creativity', 'PERSONALITY', 'DEVELOPMENT', 'Innovative thinking and problem solving', 4),
('Creativity', 'PERSONALITY', 'ADVANCED', 'Innovative thinking and problem solving', 4);
