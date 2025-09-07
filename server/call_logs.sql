-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_avatar TEXT,
  type TEXT NOT NULL, -- 'incoming' or 'outgoing'
  timestamp DATETIME NOT NULL,
  duration INTEGER DEFAULT 0
);

-- Seed data
INSERT INTO call_logs (contact_name, contact_phone, contact_avatar, type, timestamp, duration) VALUES
  ('Ada Lovelace', '+2348012345678', NULL, 'outgoing', '2025-09-01 10:00:00', 120),
  ('Chinedu Okafor', '+2348098765432', NULL, 'incoming', '2025-09-02 14:30:00', 0),
  ('Ngozi Nwosu', '+2348034567890', NULL, 'outgoing', '2025-09-03 09:15:00', 300),
  ('Emeka Obi', '+2348023456789', NULL, 'incoming', '2025-09-04 16:45:00', 180),
  ('Fatima Bello', '+2348076543210', NULL, 'outgoing', '2025-09-05 12:20:00', 0),
  ('Ifeanyi Ubah', '+2348054321098', NULL, 'incoming', '2025-09-06 18:10:00', 240);
